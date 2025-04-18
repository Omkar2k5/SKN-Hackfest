package com.example.smartfianacetracker;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.IBinder;
import android.provider.Telephony;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.example.smartfianacetracker.utils.ServiceManager;
import com.example.smartfianacetracker.utils.PreferenceManager;

public class SmsService extends Service {
    private static final String TAG = "SmsService";
    private static final String CHANNEL_ID = "SmsServiceChannel";
    private static final int NOTIFICATION_ID = 1;
    
    private SmsReceiver smsReceiver;
    private ServiceManager serviceManager;
    private PreferenceManager preferenceManager;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "SMS Service created");
        
        serviceManager = ServiceManager.getInstance(this);
        preferenceManager = new PreferenceManager(this);
        
        if (!preferenceManager.isLoggedIn()) {
            Log.e(TAG, "No user logged in, stopping service");
            stopSelf();
            return;
        }

        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());

        smsReceiver = new SmsReceiver(serviceManager);
        registerReceiver(smsReceiver, new IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION));
        
        serviceManager.updateServiceStatus("running");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "SMS Service started");
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (smsReceiver != null) {
            unregisterReceiver(smsReceiver);
        }
        Log.d(TAG, "SMS Service destroyed");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_ID,
                "SMS Service Channel",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Smart Finance Tracker")
            .setContentText("Monitoring SMS transactions")
            .setSmallIcon(R.drawable.finance_logo)
            .build();
    }
} 