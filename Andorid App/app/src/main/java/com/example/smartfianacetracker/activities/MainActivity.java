package com.example.smartfianacetracker.activities;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.appcompat.widget.Toolbar;
import com.example.smartfianacetracker.R;
import com.example.smartfianacetracker.SmsService;
import com.example.smartfianacetracker.utils.PreferenceManager;
import com.google.android.material.switchmaterial.SwitchMaterial;

public class MainActivity extends AppCompatActivity {
    private static final int PERMISSION_REQUEST_CODE = 123;
    private SwitchMaterial serviceToggle;
    private PreferenceManager preferenceManager;
    private Toolbar toolbar;

    private final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.READ_SMS,
        Manifest.permission.POST_NOTIFICATIONS
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        setupToolbar();
        setupServiceToggle();
        
        // Show permission dialog if permissions not granted
        if (!checkPermissions()) {
            showPermissionExplanationDialog();
        }
    }

    private void setupToolbar() {
        toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
    }

    private void setupServiceToggle() {
        preferenceManager = new PreferenceManager(this);
        serviceToggle = findViewById(R.id.serviceToggle);
        
        // Check if service is running and update switch state
        boolean isServiceRunning = preferenceManager.isServiceRunning();
        serviceToggle.setChecked(isServiceRunning);
        updateServiceIndicator(isServiceRunning);

        serviceToggle.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (isChecked) {
                if (checkPermissions()) {
                    startSmsService();
                } else {
                    showPermissionExplanationDialog();
                    serviceToggle.setChecked(false);
                }
            } else {
                stopSmsService();
            }
        });

        // Start service if it was running before and permissions are granted
        if (isServiceRunning && checkPermissions()) {
            startSmsService();
        }
    }

    private void updateServiceIndicator(boolean isRunning) {
        int color = isRunning ? 
            ContextCompat.getColor(this, R.color.success_green) : 
            ContextCompat.getColor(this, R.color.error);
        
        serviceToggle.setThumbTintList(android.content.res.ColorStateList.valueOf(color));
    }

    private boolean checkPermissions() {
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) 
                != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    private void showPermissionExplanationDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Permissions Required")
            .setMessage("This app needs SMS and notification permissions to monitor your financial transactions through SMS messages. Please grant these permissions to continue.")
            .setPositiveButton("Grant Permissions", (dialog, which) -> requestPermissions())
            .setNegativeButton("Cancel", (dialog, which) -> 
                Toast.makeText(this, "App requires permissions to function properly", Toast.LENGTH_LONG).show())
            .setCancelable(false)
            .show();
    }

    private void requestPermissions() {
        ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (allGranted) {
                Toast.makeText(this, "Permissions granted successfully", Toast.LENGTH_SHORT).show();
                if (preferenceManager.isServiceRunning()) {
                    serviceToggle.setChecked(true);
                    startSmsService();
                }
            } else {
                Toast.makeText(this, "App needs all permissions to function properly", Toast.LENGTH_LONG).show();
                serviceToggle.setChecked(false);
                preferenceManager.setServiceRunning(false);
                updateServiceIndicator(false);
            }
        }
    }

    private void startSmsService() {
        Intent serviceIntent = new Intent(this, SmsService.class);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
        preferenceManager.setServiceRunning(true);
        updateServiceIndicator(true);
        Toast.makeText(this, "SMS monitoring service started", Toast.LENGTH_SHORT).show();
    }

    private void stopSmsService() {
        stopService(new Intent(this, SmsService.class));
        preferenceManager.setServiceRunning(false);
        updateServiceIndicator(false);
        Toast.makeText(this, "SMS monitoring service stopped", Toast.LENGTH_SHORT).show();
    }
} 