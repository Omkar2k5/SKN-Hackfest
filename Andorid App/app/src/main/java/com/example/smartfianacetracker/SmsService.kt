package com.example.smartfianacetracker

import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.provider.Telephony
import android.util.Log
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.google.firebase.database.FirebaseDatabase
import java.util.regex.Pattern
import java.text.SimpleDateFormat
import java.util.*
import android.app.job.JobInfo
import android.app.job.JobScheduler
import android.content.ComponentName

class SmsService : Service() {
    private var smsReceiver: SmsReceiver? = null
    private val channelId = "SmsForegroundService"
    private var databaseInstance: FirebaseDatabase? = null
    private var isServiceRunning = false
    private val jobScheduler by lazy { getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Starting SMS Service")
        startServiceWithRetry()
        scheduleServiceRestartJob()
    }

    private fun startServiceWithRetry(retryCount: Int = 0) {
        try {
            if (!isServiceRunning) {
                // Initialize components in sequence
                initializeFirebase()
        createNotificationChannel()
                startForegroundWithNotification()
        registerSmsReceiver()
                isServiceRunning = true
                Log.d(TAG, "SMS Service started successfully")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting service (attempt ${retryCount + 1})", e)
            if (retryCount < 3) {
                // Retry after a delay
                android.os.Handler().postDelayed({
                    startServiceWithRetry(retryCount + 1)
                }, 2000) // 2 second delay before retry
            } else {
                handleServiceError("Failed to start service after retries", e)
            }
        }
    }

    private fun handleServiceError(message: String, error: Exception) {
        Log.e(TAG, message, error)
        Toast.makeText(this, "$message: ${error.message}", Toast.LENGTH_LONG).show()
        stopSelf()
    }

    private fun initializeFirebase() {
        try {
            if (databaseInstance == null) {
                Log.d(TAG, "Initializing Firebase in Service")
                databaseInstance = FirebaseDatabase.getInstance("https://smart-fiance-tracker-default-rtdb.asia-southeast1.firebasedatabase.app/")
                databaseInstance?.setPersistenceEnabled(true)
                
                // Test database connection
                val ref = databaseInstance?.getReference("service_status")
                ref?.setValue("running_${System.currentTimeMillis()}")?.addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        Log.d(TAG, "Firebase connection test successful")
                    } else {
                        Log.e(TAG, "Firebase connection test failed", task.exception)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing Firebase", e)
            throw e
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
            val serviceChannel = NotificationChannel(
                channelId,
                "SMS Monitoring Service",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Monitors SMS transactions"
                    enableLights(true)
                    setShowBadge(true)
                    lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                }
                
                val manager = getSystemService(NotificationManager::class.java)
                manager?.createNotificationChannel(serviceChannel)
                Log.d(TAG, "Notification channel created successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error creating notification channel", e)
                throw e
            }
        }
    }

    private fun startForegroundWithNotification() {
        try {
            // Create the notification
            val notification = NotificationCompat.Builder(this, channelId)
                .setContentTitle("Transaction Monitor Active")
                .setContentText("Monitoring SMS transactions")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setOngoing(true)
                .setAutoCancel(false)
                .build()

            // Set foreground service type for Android 12+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
            
            Log.d(TAG, "Foreground service started with notification")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting foreground service", e)
            throw e
        }
    }

    private fun registerSmsReceiver() {
        try {
            if (smsReceiver == null) {
        smsReceiver = SmsReceiver()
                val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
                registerReceiver(smsReceiver, filter)
                Log.d(TAG, "SMS receiver registered successfully")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error registering SMS receiver", e)
            throw e
        }
    }

    private fun scheduleServiceRestartJob() {
        try {
            val componentName = ComponentName(this, SmsService::class.java)
            val jobInfo = JobInfo.Builder(SERVICE_RESTART_JOB_ID, componentName)
                .setPersisted(true) // Survive reboots
                .setPeriodic(15 * 60 * 1000L) // 15 minutes
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .build()

            val result = jobScheduler.schedule(jobInfo)
            if (result == JobScheduler.RESULT_SUCCESS) {
                Log.d(TAG, "Service restart job scheduled successfully")
            } else {
                Log.e(TAG, "Failed to schedule service restart job")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error scheduling service restart job", e)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Service onStartCommand called")
        if (!isServiceRunning) {
            startServiceWithRetry()
        }
        // Use START_STICKY to ensure service restarts if killed
        return START_STICKY
    }

    override fun onDestroy() {
        try {
            super.onDestroy()
            isServiceRunning = false
            
            // Unregister receiver safely
            smsReceiver?.let {
                try {
                    unregisterReceiver(it)
                } catch (e: Exception) {
                    Log.e(TAG, "Error unregistering receiver", e)
                }
            }
            smsReceiver = null
            
            // Schedule immediate restart
            val intent = Intent(this, BootReceiver::class.java)
            intent.action = "com.example.smartfianacetracker.RESTART_SERVICE"
            sendBroadcast(intent)
            
            Log.d(TAG, "Service destroyed, restart initiated")
        } catch (e: Exception) {
            Log.e(TAG, "Error in onDestroy", e)
        }
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        try {
            super.onTaskRemoved(rootIntent)
            // Schedule immediate restart
            val restartServiceIntent = Intent(applicationContext, SmsService::class.java)
            val restartServicePendingIntent = PendingIntent.getService(
                applicationContext, 1, restartServiceIntent, 
                PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
            )
            
            val alarmService = applicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmService.setAlarmClock(
                AlarmManager.AlarmClockInfo(
                    System.currentTimeMillis() + 1000,
                    restartServicePendingIntent
                ),
                restartServicePendingIntent
            )
            
            // Also send broadcast for backup restart mechanism
            sendBroadcast(Intent("com.example.smartfianacetracker.RESTART_SERVICE"))
            
            Log.d(TAG, "Service task removed, restart scheduled")
        } catch (e: Exception) {
            Log.e(TAG, "Error in onTaskRemoved", e)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    class SmsReceiver : BroadcastReceiver() {
        private var databaseInstance: FirebaseDatabase? = null

        override fun onReceive(context: Context, intent: Intent) {
            try {
            Log.d(TAG, "SMS Received")
                if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
                    Log.d(TAG, "Not an SMS received action")
                    return
                }

                val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
                if (messages.isEmpty()) {
                    Log.d(TAG, "No messages in intent")
                    return
                }

                messages.forEach { sms ->
                    try {
                    val messageBody = sms.messageBody
                        Log.d(TAG, "Full message content: $messageBody")
                    
                        if (isBankingTransactionMessage(messageBody)) {
                            Log.d(TAG, "Transaction message detected, processing...")
                        processTransactionSMS(messageBody)
                    } else {
                            Log.d(TAG, "Not a transaction message, skipping")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error processing individual SMS: ${e.message}", e)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in onReceive: ${e.message}", e)
            }
        }

        private fun isBankingTransactionMessage(message: String): Boolean {
            val lowerMessage = message.lowercase()
            return lowerMessage.contains("credited") ||
                   lowerMessage.contains("debited") ||
                   lowerMessage.contains("payment") ||
                   lowerMessage.contains("sent") ||
                   lowerMessage.contains("received") ||
                   (lowerMessage.contains("rs.") || lowerMessage.contains("inr")) &&
                   (lowerMessage.contains("a/c") || lowerMessage.contains("acct") || 
                    lowerMessage.contains("account") || lowerMessage.contains("ac") ||
                    lowerMessage.contains("bank") || lowerMessage.contains("upi"))
        }

        private fun processTransactionSMS(message: String) {
            try {
                Log.d(TAG, "Processing transaction SMS: $message")
                
                // Determine transaction type
                val transactionType = determineTransactionType(message)
                Log.d(TAG, "Transaction type: $transactionType")
                
                // Extract amount
                val amount = extractAmount(message)
                Log.d(TAG, "Amount: $amount")
                
                // Extract account info
                val (accountNumber, _) = extractAccountInfo(message)
                Log.d(TAG, "Account: $accountNumber")
                
                // Extract UPI ID
                val upiId = extractUpiId(message)
                Log.d(TAG, "UPI ID: $upiId")
                    
                // Extract merchant name
                val merchantName = extractMerchantName(message, transactionType)
                Log.d(TAG, "Merchant: $merchantName")
                
                // Extract transaction mode
                val transactionMode = extractTransactionMode(message)
                Log.d(TAG, "Mode: $transactionMode")
                
                // Create transaction object
                val transaction = Transaction(
                    transactionType = transactionType,
                    amount = amount,
                    timestamp = System.currentTimeMillis(),
                    upiId = upiId,
                    merchantName = merchantName,
                    accountNumber = accountNumber,
                    transactionMode = transactionMode
                )
                
                // Save transaction
                if (validateTransaction(transaction)) {
                    Log.d(TAG, "Transaction validated, saving to Firebase")
                    saveTransaction(transaction)
                } else {
                    Log.e(TAG, "Invalid transaction data: $transaction")
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error processing transaction SMS: ${e.message}", e)
            }
        }

        private fun determineTransactionType(message: String): String {
            val lowerMessage = message.lowercase()
            return when {
                // Credit patterns
                lowerMessage.contains("credited") -> "CREDIT"
                lowerMessage.contains("received") -> "CREDIT"
                lowerMessage.contains("credit") && !lowerMessage.contains("credit card") -> "CREDIT"
                // Debit patterns
                lowerMessage.contains("debited") -> "DEBIT"
                lowerMessage.contains("debit") && !lowerMessage.contains("debit card") -> "DEBIT"
                lowerMessage.contains("payment of") || lowerMessage.contains("paid") -> "DEBIT"
                lowerMessage.contains("sent") -> "DEBIT"
                // Card payment specific
                lowerMessage.contains("payment") && lowerMessage.contains("credited to your card") -> "CREDIT"
                lowerMessage.contains("payment") && lowerMessage.contains("card") -> "DEBIT"
                else -> "UNKNOWN"
            }
        }

        private fun extractAmount(message: String): Double {
            val patterns = listOf(
                "(?:RS|RS.|Rs|Rs.|INR|₹)\\s*([0-9]+(?:,[0-9]+)*(?:\\.[0-9]{2})?)",
                "(?:RS|RS.|Rs|Rs.|INR|₹)\\s*([0-9]+(?:,[0-9]+)*)",
                "([0-9]+(?:,[0-9]+)*(?:\\.[0-9]{2})?)\\s*(?:RS|RS.|Rs|Rs.|INR|₹)",
                "Sent Rs\\.([0-9]+(?:\\.[0-9]{2})?)"
            )

            for (pattern in patterns) {
                val matcher = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(message)
                if (matcher.find()) {
                    return matcher.group(1)?.replace(",", "")?.toDoubleOrNull() ?: 0.0
                }
            }
            return 0.0
        }

        private fun extractAccountInfo(message: String): Pair<String, String> {
            // Account number patterns
            val accountPatterns = listOf(
                "A/c\\s*[Xx]+([0-9]+)",
                "Acct\\s*[Xx]+([0-9]+)",
                "Account\\s*[Xx]+([0-9]+)",
                "AC\\s*[Xx]+([0-9]+)",
                "Bank\\s*AC\\s*[Xx]+([0-9]+)",
                "[Xx]{2,}([0-9]{4})"
            )

            // Card number patterns
            val cardPatterns = listOf(
                "card\\s*(?:no\\.?)?\\s*(?:ending|ending in)?\\s*([0-9]{4,})",
                "card\\s*[Xx]+([0-9]{4})"
            )

            var accountNumber = ""
            var cardNumber = ""

            // Try to find account number
            for (pattern in accountPatterns) {
                val matcher = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(message)
                if (matcher.find()) {
                    accountNumber = matcher.group(1) ?: ""
                    break
                }
            }

            // Try to find card number
            for (pattern in cardPatterns) {
                val matcher = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(message)
                if (matcher.find()) {
                    cardNumber = matcher.group(1) ?: ""
                    break
                }
            }

            return Pair(accountNumber, cardNumber)
        }

        private fun extractReferenceNumber(message: String): String {
            val patterns = listOf(
                "(?:ref(?:erence)?|txn)\\s*(?:no\\.?|number)?\\s*[:#]?\\s*([A-Za-z0-9]+)",
                "IMPS(?::|\\s+)([A-Za-z0-9]+)",
                "NEFT(?::|\\s+)([A-Za-z0-9]+)",
                "UPI\\s*Ref\\s*([0-9]+)"  // Updated to match numeric UPI references
            )

            for (pattern in patterns) {
                val matcher = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(message)
                if (matcher.find()) {
                    return matcher.group(1) ?: ""
                }
            }
            return ""
        }

        private fun extractTransactionMode(message: String): String {
            return when {
                message.uppercase().contains("IMPS") -> "IMPS"
                message.uppercase().contains("NEFT") -> "NEFT"
                message.uppercase().contains("UPI") -> "UPI"
                message.uppercase().contains("RTGS") -> "RTGS"
                else -> ""
            }
        }

        private fun extractBalance(message: String): Double? {
            val patterns = listOf(
                "(?:available|avl|bal)(?:ance)?\\s*(?:is)?\\s*(?:RS|RS.|Rs|Rs.|INR|₹)\\s*([0-9]+(?:,[0-9]+)*(?:\\.[0-9]{2})?)",
                "(?:available|avl|bal)(?:ance)?\\s*(?:RS|RS.|Rs|Rs.|INR|₹)\\s*([0-9]+(?:,[0-9]+)*(?:\\.[0-9]{2})?)"
            )

            for (pattern in patterns) {
                val matcher = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(message)
                if (matcher.find()) {
                    return matcher.group(1)?.replace(",", "")?.toDoubleOrNull()
                }
            }
            return null
        }

        private fun extractTimestamp(message: String): Long {
            val datePatterns = listOf(
                "\\b(\\d{2})[-/](\\d{2})[-/](\\d{2,4})\\b",  // Added support for 2-digit year
                "\\b(\\d{2})-([A-Za-z]{3})-?(\\d{2,4})\\b"   // Added support for 2-digit year
            )
            val timePattern = "\\b(\\d{1,2})[:.]?(\\d{2})\\b"
            
            val calendar = Calendar.getInstance()
            
            // Try to extract date
            for (pattern in datePatterns) {
                val matcher = Pattern.compile(pattern).matcher(message)
                if (matcher.find()) {
                    when (pattern) {
                        datePatterns[0] -> { // DD/MM/YY or DD/MM/YYYY
                            calendar.set(Calendar.DAY_OF_MONTH, matcher.group(1)?.toInt() ?: 1)
                            calendar.set(Calendar.MONTH, (matcher.group(2)?.toInt() ?: 1) - 1)
                            var year = matcher.group(3)?.toInt() ?: calendar.get(Calendar.YEAR)
                            if (year < 100) year += 2000  // Convert 2-digit year to 4-digit
                            calendar.set(Calendar.YEAR, year)
                        }
                        datePatterns[1] -> { // DD-MMM-YY or DD-MMM-YYYY
                            calendar.set(Calendar.DAY_OF_MONTH, matcher.group(1)?.toInt() ?: 1)
                            val month = SimpleDateFormat("MMM", Locale.ENGLISH).parse(matcher.group(2))?.let {
                                val cal = Calendar.getInstance()
                                cal.time = it
                                cal.get(Calendar.MONTH)
                            } ?: 0
                            calendar.set(Calendar.MONTH, month)
                            var year = matcher.group(3)?.toInt() ?: calendar.get(Calendar.YEAR)
                            if (year < 100) year += 2000  // Convert 2-digit year to 4-digit
                            calendar.set(Calendar.YEAR, year)
                        }
                    }
                    break
                }
            }
            
            // Try to extract time
            val timeMatcher = Pattern.compile(timePattern).matcher(message)
            if (timeMatcher.find()) {
                calendar.set(Calendar.HOUR_OF_DAY, timeMatcher.group(1)?.toInt() ?: 0)
                calendar.set(Calendar.MINUTE, timeMatcher.group(2)?.toInt() ?: 0)
            }
            
            return calendar.timeInMillis
        }

        private fun extractUpiId(message: String): String {
            val patterns = listOf(
                "[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+",
                "\\d{10}@[a-zA-Z]+"  // For phone number based UPI IDs
            )

            for (pattern in patterns) {
                val matcher = Pattern.compile(pattern).matcher(message)
                if (matcher.find()) {
                    return matcher.group() ?: ""
                }
            }
            return ""
        }

        private fun extractMerchantName(message: String, transactionType: String): String {
            val patterns = when (transactionType) {
                "DEBIT" -> listOf(
                    "(?:to|paid to|sent to)\\s+([^\\s]+(?:\\s+[^\\s]+)*?)\\s+(?:on|at|via|ref|\\d)",
                    "(?:to|paid to|sent to)\\s+([^\\s]+(?:\\s+[^\\s]+)*?)$",
                    "to\\s+(\\d{10}@[a-zA-Z]+)"  // For phone number UPI IDs
                )
                "CREDIT" -> listOf(
                    "(?:from|received from)\\s+([^\\s]+(?:\\s+[^\\s]+)*?)\\s+(?:on|at|via|ref|\\d)",
                    "(?:from|received from)\\s+([^\\s]+(?:\\s+[^\\s]+)*?)$"
                )
                else -> listOf(
                    "(?:to|from|paid to|received from|sent to)\\s+([^\\s]+(?:\\s+[^\\s]+)*?)\\s+(?:on|at|via|ref|\\d)",
                    "(?:to|from|paid to|received from|sent to)\\s+([^\\s]+(?:\\s+[^\\s]+)*?)$",
                    "to\\s+(\\d{10}@[a-zA-Z]+)"
                )
            }

            for (pattern in patterns) {
                val matcher = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(message)
                if (matcher.find()) {
                    val merchant = matcher.group(1)?.trim() ?: "Unknown"
                    // If the merchant is a UPI ID with a phone number, try to extract just the phone number
                    if (merchant.matches(Regex("\\d{10}@[a-zA-Z]+"))) {
                        return merchant.split("@")[0] // Return just the phone number
                    }
                    return merchant
                }
            }
            return "Unknown"
        }

        private fun validateTransaction(transaction: Transaction): Boolean {
            return transaction.transactionType in listOf("CREDIT", "DEBIT") &&
                   transaction.amount > 0 &&
                   transaction.timestamp > 0 &&
                   (transaction.accountNumber.isNotEmpty() || transaction.upiId.isNotEmpty()) &&
                   transaction.merchantName.isNotEmpty()
        }

        private fun saveTransaction(transaction: Transaction) {
            try {
                Log.d(TAG, "Starting to save transaction")
                
                if (!validateTransaction(transaction)) {
                    Log.e(TAG, "Invalid transaction data: $transaction")
                    return
                }
                
                // Initialize database if not already initialized
                if (databaseInstance == null) {
                    Log.d(TAG, "Initializing Firebase database in receiver")
                    databaseInstance = FirebaseDatabase.getInstance("https://smart-fiance-tracker-default-rtdb.asia-southeast1.firebasedatabase.app/")
                }
                
                val database = databaseInstance ?: throw Exception("Failed to initialize Firebase database")
                
                // Choose collection based on transaction type
                val collectionName = if (transaction.transactionType == "CREDIT") "credit" else "debit"
                val ref = database.getReference(collectionName)
                
                // Generate a new key for the transaction
                val transactionId = ref.push().key ?: throw Exception("Failed to generate transaction key")
                
                Log.d(TAG, "Saving ${transaction.transactionType} transaction with ID: $transactionId")
                Log.d(TAG, "Transaction details: $transaction")
                
                // Create a map of transaction data
                val transactionMap = mapOf(
                    "amount" to transaction.amount,
                    "timestamp" to transaction.timestamp,
                    "upiId" to transaction.upiId,
                    "merchantName" to transaction.merchantName,
                    "accountNumber" to transaction.accountNumber,
                    "transactionMode" to transaction.transactionMode
                )
                
                // Save the transaction
                ref.child(transactionId).setValue(transactionMap)
                    .addOnSuccessListener {
                        Log.d(TAG, "Transaction saved successfully to $collectionName with ID: $transactionId")
                        // Verify the save
                        ref.child(transactionId).get().addOnSuccessListener { snapshot ->
                            if (snapshot.exists()) {
                                Log.d(TAG, "Verification successful. Saved data: ${snapshot.value}")
                            } else {
                                Log.e(TAG, "Verification failed: Data not found after save")
                            }
                        }
                    }
                    .addOnFailureListener { e ->
                        Log.e(TAG, "Failed to save transaction: ${e.message}", e)
                        throw e
                    }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error in saveTransaction: ${e.message}", e)
                e.printStackTrace()
            }
        }

        companion object {
            private const val TAG = "SmsReceiver"
        }
    }

    companion object {
        private const val TAG = "SmsService"
        private const val NOTIFICATION_ID = 1
        private const val SERVICE_RESTART_JOB_ID = 100
    }
} 