package com.example.smartfianacetracker

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.smartfianacetracker.databinding.ActivityMainBinding
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.FirebaseApp
import com.google.android.material.switchmaterial.SwitchMaterial

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private var isServiceRunning = false
    private lateinit var serviceToggle: SwitchMaterial

    override fun onCreate(savedInstanceState: Bundle?) {
        try {
            super.onCreate(savedInstanceState)
            Log.d(TAG, "Starting MainActivity")

            // Initialize Firebase
            if (!isFirebaseInitialized()) {
                FirebaseApp.initializeApp(this)
                Log.d(TAG, "Firebase initialized")
            }

            // Setup view binding
            binding = ActivityMainBinding.inflate(layoutInflater)
            setContentView(binding.root)

            // Initialize Firebase structure
            initializeFirebaseStructure()
            
            // Check permissions and start service
            checkAndRequestPermissions()

            updateStatusText("App initialized successfully")
            Log.d(TAG, "MainActivity onCreate completed")

            serviceToggle = findViewById(R.id.serviceToggle)
            serviceToggle.setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) {
                    startBackgroundService()
                } else {
                    stopBackgroundService()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in onCreate", e)
            handleError("Error initializing app", e)
        }
    }

    private fun isFirebaseInitialized(): Boolean {
        try {
            FirebaseApp.getInstance()
            return true
        } catch (e: IllegalStateException) {
            return false
        }
    }

    private fun initializeFirebaseStructure() {
        try {
            Log.d(TAG, "Initializing Firebase structure")
            val database = FirebaseDatabase.getInstance("https://skn-hackfest-default-rtdb.asia-southeast1.firebasedatabase.app/")
            database.setPersistenceEnabled(true)
            
            val ref = database.getReference("transactions")
            
            // Test connection
            ref.child("test").setValue("connection_test")
                .addOnSuccessListener {
                    Log.d(TAG, "Firebase connection test successful")
                    updateStatusText("Database Connected")
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Firebase connection test failed", e)
                    handleError("Database connection failed", e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing Firebase", e)
            handleError("Firebase initialization failed", e)
        }
    }

    private fun checkAndRequestPermissions() {
        try {
            Log.d(TAG, "Checking permissions")
            val permissions = mutableListOf(
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS
            )

            // Add POST_NOTIFICATIONS permission for Android 13+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            }

            val permissionsToRequest = permissions.filter {
                ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
            }.toTypedArray()

            if (permissionsToRequest.isEmpty()) {
                Log.d(TAG, "All permissions granted")
                startSmsService()
            } else {
                Log.d(TAG, "Requesting permissions: ${permissionsToRequest.joinToString()}")
                ActivityCompat.requestPermissions(
                    this,
                    permissionsToRequest,
                    PERMISSIONS_REQUEST_CODE
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking permissions", e)
            handleError("Error checking permissions", e)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        try {
            super.onRequestPermissionsResult(requestCode, permissions, grantResults)
            if (requestCode == PERMISSIONS_REQUEST_CODE) {
                if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                    Log.d(TAG, "All permissions granted")
                    startSmsService()
                    updateStatusText("Service started successfully")
                } else {
                    Log.w(TAG, "Some permissions denied")
                    updateStatusText("Permissions required to monitor SMS")
                    Toast.makeText(this, "App needs permissions to work properly", Toast.LENGTH_LONG).show()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in permission result", e)
            handleError("Error handling permissions", e)
        }
    }

    private fun startSmsService() {
        try {
            if (!isServiceRunning) {
                Log.d(TAG, "Starting SMS service")
                val serviceIntent = Intent(this, SmsService::class.java)
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent)
                } else {
                    startService(serviceIntent)
                }
                
                isServiceRunning = true
                updateStatusText("SMS Monitoring Service is Running")
                
                // Schedule periodic service check
                scheduleServiceCheck()
            } else {
                Log.d(TAG, "Service is already running")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting service", e)
            handleError("Error starting SMS service", e)
        }
    }

    private fun scheduleServiceCheck() {
        // Check service status every 15 minutes
        android.os.Handler().postDelayed({
            if (!isServiceRunning) {
                startSmsService()
            }
            scheduleServiceCheck()
        }, 15 * 60 * 1000) // 15 minutes
    }

    private fun updateStatusText(status: String) {
        try {
            binding.statusText.text = status
            Log.d(TAG, "Status updated: $status")
        } catch (e: Exception) {
            Log.e(TAG, "Error updating status text", e)
        }
    }

    private fun handleError(message: String, error: Exception) {
        val errorMessage = "$message: ${error.message}"
        Log.e(TAG, errorMessage, error)
        updateStatusText("Error: $message")
        Toast.makeText(this, errorMessage, Toast.LENGTH_LONG).show()
    }

    private fun startBackgroundService() {
        val serviceIntent = Intent(this, BackgroundService::class.java)
        startService(serviceIntent)
    }
    
    private fun stopBackgroundService() {
        val serviceIntent = Intent(this, BackgroundService::class.java)
        stopService(serviceIntent)
    }

    companion object {
        private const val TAG = "MainActivity"
        private const val PERMISSIONS_REQUEST_CODE = 123
    }
} 