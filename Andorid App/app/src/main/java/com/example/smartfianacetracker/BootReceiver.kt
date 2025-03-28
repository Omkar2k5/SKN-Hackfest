package com.example.smartfianacetracker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "com.example.smartfianacetracker.RESTART_SERVICE") {
            
            Log.d(TAG, "Received boot or restart broadcast")
            val serviceIntent = Intent(context, SmsService::class.java)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
            Log.d(TAG, "Service start requested")
        }
    }

    companion object {
        private const val TAG = "BootReceiver"
    }
} 