package com.example.smartfianacetracker

import android.Manifest
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.preference.PreferenceManager
import com.example.smartfianacetracker.databinding.ActivityMainBinding
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.FirebaseApp
import com.google.android.material.switchmaterial.SwitchMaterial

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private var isServiceRunning = false
    private lateinit var serviceToggle: SwitchMaterial
    private lateinit var sharedPreferences: SharedPreferences

    private val requiredPermissions = mutableListOf(
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.READ_SMS
    ).apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

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
            
            // Initialize preferences and toggle
            setupPreferencesAndToggle()

            // Check permissions immediately when app starts
            if (!areAllPermissionsGranted()) {
                showPermissionExplanationDialog()
            } else {
                initializeServiceIfEnabled()
            }

            Log.d(TAG, "MainActivity onCreate completed")
        } catch (e: Exception) {
            Log.e(TAG, "Error in onCreate", e)
            handleError("Error initializing app", e)
        }
    }

    private fun setupPreferencesAndToggle() {
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this)
        serviceToggle = findViewById(R.id.serviceToggle)

        // Initialize switch state from preferences
        serviceToggle.isChecked = sharedPreferences.getBoolean("service_enabled", false)

        serviceToggle.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                if (areAllPermissionsGranted()) {
                    startSmsService()
                } else {
                    showPermissionExplanationDialog()
                    serviceToggle.isChecked = false
                }
            } else {
                stopSmsService()
            }
            sharedPreferences.edit().putBoolean("service_enabled", isChecked).apply()
        }
    }

    private fun areAllPermissionsGranted(): Boolean {
        return requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun showPermissionExplanationDialog() {
        AlertDialog.Builder(this)
            .setTitle("Permissions Required")
            .setMessage("This app needs SMS and notification permissions to monitor your financial transactions through SMS messages. Please grant these permissions to continue.")
            .setPositiveButton("Grant Permissions") { _, _ ->
                requestPermissions()
            }
            .setNegativeButton("Cancel") { _, _ ->
                Toast.makeText(this, "App requires permissions to function properly", Toast.LENGTH_LONG).show()
            }
            .setCancelable(false)
            .show()
    }

    private fun requestPermissions() {
        ActivityCompat.requestPermissions(
            this,
            requiredPermissions.toTypedArray(),
            PERMISSIONS_REQUEST_CODE
        )
    }

    private fun initializeServiceIfEnabled() {
        if (sharedPreferences.getBoolean("service_enabled", false)) {
            startSmsService()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            PERMISSIONS_REQUEST_CODE -> {
                if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                    Log.d(TAG, "All permissions granted")
                    Toast.makeText(this, "Permissions granted successfully", Toast.LENGTH_SHORT).show()
                    initializeServiceIfEnabled()
                } else {
                    Log.w(TAG, "Some permissions denied")
                    Toast.makeText(this, "App needs all permissions to function properly", Toast.LENGTH_LONG).show()
                    serviceToggle.isChecked = false
                    sharedPreferences.edit().putBoolean("service_enabled", false).apply()
                }
            }
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
            
            ref.child("test").setValue("connection_test")
                .addOnSuccessListener {
                    Log.d(TAG, "Firebase connection test successful")
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

    private fun startSmsService() {
        try {
            val serviceIntent = Intent(this, SmsService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
            Toast.makeText(this, "SMS monitoring service started", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Log.e(TAG, "Error starting service: ${e.message}")
            Toast.makeText(this, "Failed to start service", Toast.LENGTH_SHORT).show()
            serviceToggle.isChecked = false
            sharedPreferences.edit().putBoolean("service_enabled", false).apply()
        }
    }

    private fun stopSmsService() {
        try {
            stopService(Intent(this, SmsService::class.java))
            Toast.makeText(this, "SMS monitoring service stopped", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping service: ${e.message}")
            Toast.makeText(this, "Failed to stop service", Toast.LENGTH_SHORT).show()
        }
    }

    private fun handleError(message: String, error: Exception) {
        val errorMessage = "$message: ${error.message}"
        Log.e(TAG, errorMessage, error)
        Toast.makeText(this, errorMessage, Toast.LENGTH_LONG).show()
    }

    companion object {
        private const val TAG = "MainActivity"
        private const val PERMISSIONS_REQUEST_CODE = 123
    }
} 