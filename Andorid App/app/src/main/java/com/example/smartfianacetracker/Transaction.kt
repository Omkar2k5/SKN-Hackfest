package com.example.smartfianacetracker

data class Transaction(
    val transactionType: String = "", // "CREDIT" or "DEBIT"
    val amount: Double = 0.0,
    val timestamp: Long = System.currentTimeMillis(),
    val upiId: String = "",
    val merchantName: String = "Unknown", // Default value if not found
    val accountNumber: String = "", // Masked account number
    val transactionMode: String = "" // NEFT, IMPS, UPI, etc.
) 