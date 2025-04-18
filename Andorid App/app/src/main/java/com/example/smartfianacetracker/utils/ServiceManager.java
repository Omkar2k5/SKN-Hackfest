package com.example.smartfianacetracker.utils;

import android.content.Context;
import android.util.Log;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import java.util.HashMap;
import java.util.Map;

public class ServiceManager {
    private static final String TAG = "ServiceManager";
    private final DatabaseReference databaseReference;
    private final PreferenceManager preferenceManager;
    private static ServiceManager instance;

    private ServiceManager(Context context) {
        databaseReference = FirebaseDatabase.getInstance().getReference();
        preferenceManager = new PreferenceManager(context);
    }

    public static synchronized ServiceManager getInstance(Context context) {
        if (instance == null) {
            instance = new ServiceManager(context.getApplicationContext());
        }
        return instance;
    }

    public void updateServiceStatus(String status) {
        String userId = preferenceManager.getUserId();
        if (userId != null) {
            databaseReference.child("users").child(userId)
                .child("service_status")
                .setValue("running_" + System.currentTimeMillis())
                .addOnFailureListener(e -> Log.e(TAG, "Failed to update service status", e));
        }
    }

    public void storeTransaction(String type, Map<String, Object> transactionData) {
        String userId = preferenceManager.getUserId();
        if (userId == null) {
            Log.e(TAG, "Cannot store transaction: User ID is null");
            return;
        }

        String key = type + "_" + System.currentTimeMillis();
        databaseReference.child("users").child(userId)
            .child(type)
            .child(key)
            .setValue(transactionData)
            .addOnSuccessListener(aVoid -> Log.d(TAG, "Transaction stored successfully"))
            .addOnFailureListener(e -> Log.e(TAG, "Failed to store transaction", e));
    }

    public void updateBudget(String budgetId, Map<String, Object> updates) {
        String userId = preferenceManager.getUserId();
        if (userId == null) {
            Log.e(TAG, "Cannot update budget: User ID is null");
            return;
        }

        databaseReference.child("users").child(userId)
            .child("budgets")
            .child(budgetId)
            .updateChildren(updates)
            .addOnSuccessListener(aVoid -> Log.d(TAG, "Budget updated successfully"))
            .addOnFailureListener(e -> Log.e(TAG, "Failed to update budget", e));
    }

    public void createBudget(Map<String, Object> budgetData) {
        String userId = preferenceManager.getUserId();
        if (userId == null) {
            Log.e(TAG, "Cannot create budget: User ID is null");
            return;
        }

        String budgetId = "budget_" + System.currentTimeMillis();
        databaseReference.child("users").child(userId)
            .child("budgets")
            .child(budgetId)
            .setValue(budgetData)
            .addOnSuccessListener(aVoid -> Log.d(TAG, "Budget created successfully"))
            .addOnFailureListener(e -> Log.e(TAG, "Failed to create budget", e));
    }

    public void storeDebitTransaction(String accountNumber, String merchantName, double amount, 
                                    String transactionMode, String upiId) {
        Map<String, Object> transactionData = new HashMap<>();
        transactionData.put("accountNumber", accountNumber);
        transactionData.put("amount", amount);
        transactionData.put("merchantName", merchantName);
        transactionData.put("timestamp", System.currentTimeMillis());
        transactionData.put("transactionMode", transactionMode);
        transactionData.put("upiId", upiId);

        storeTransaction("debit", transactionData);
    }

    public void storeCreditTransaction(String accountNumber, String merchantName, double amount, 
                                     String transactionMode, String upiId) {
        Map<String, Object> transactionData = new HashMap<>();
        transactionData.put("accountNumber", accountNumber);
        transactionData.put("amount", amount);
        transactionData.put("merchantName", merchantName);
        transactionData.put("timestamp", System.currentTimeMillis());
        transactionData.put("transactionMode", transactionMode);
        transactionData.put("upiId", upiId);

        storeTransaction("credit", transactionData);
    }
} 