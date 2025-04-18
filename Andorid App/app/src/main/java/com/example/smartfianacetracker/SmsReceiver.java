package com.example.smartfianacetracker;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import android.util.Log;
import com.example.smartfianacetracker.utils.ServiceManager;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";
    private final ServiceManager serviceManager;

    public SmsReceiver(ServiceManager serviceManager) {
        this.serviceManager = serviceManager;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction() != null && intent.getAction().equals(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)) {
            SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
            for (SmsMessage message : messages) {
                processSmsMessage(message);
            }
        }
    }

    private void processSmsMessage(SmsMessage message) {
        String sender = message.getDisplayOriginatingAddress();
        String messageBody = message.getMessageBody();
        Log.d(TAG, "Processing SMS from: " + sender);

        // Check if the message is from a bank or financial institution
        if (isFinancialMessage(messageBody)) {
            TransactionDetails details = extractTransactionDetails(messageBody);
            if (details != null) {
                if (details.isDebit) {
                    serviceManager.storeDebitTransaction(
                        details.accountNumber,
                        details.merchantName,
                        details.amount,
                        details.transactionMode,
                        details.upiId
                    );
                } else {
                    serviceManager.storeCreditTransaction(
                        details.accountNumber,
                        details.merchantName,
                        details.amount,
                        details.transactionMode,
                        details.upiId
                    );
                }
            }
        }
    }

    private boolean isFinancialMessage(String message) {
        String[] keywords = {
            "debited", "credited", "spent", "received", "payment", "transferred",
            "transaction", "UPI", "NEFT", "IMPS", "withdrawn", "deposited", "balance"
        };

        message = message.toLowerCase();
        for (String keyword : keywords) {
            if (message.contains(keyword.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    private TransactionDetails extractTransactionDetails(String message) {
        try {
            TransactionDetails details = new TransactionDetails();
            
            // Determine transaction type
            details.isDebit = message.toLowerCase().contains("debited") || 
                            message.toLowerCase().contains("spent") ||
                            message.toLowerCase().contains("paid");

            // Extract amount
            Pattern amountPattern = Pattern.compile("(?i)(?:RS|INR|₹)[.\\s]*([\\d,]+(?:\\.\\d{1,2})?)");
            Matcher amountMatcher = amountPattern.matcher(message);
            if (amountMatcher.find()) {
                String amountStr = amountMatcher.group(1).replace(",", "");
                details.amount = Double.parseDouble(amountStr);
            }

            // Extract account number
            Pattern accPattern = Pattern.compile("(?i)(?:a/c|acct|account)\\s*(?:no|number|#)?\\s*[.:]*\\s*(X+|\\d+)");
            Matcher accMatcher = accPattern.matcher(message);
            if (accMatcher.find()) {
                details.accountNumber = accMatcher.group(1);
            }

            // Extract UPI ID
            Pattern upiPattern = Pattern.compile("[\\w.-]+@[\\w.-]+");
            Matcher upiMatcher = upiPattern.matcher(message);
            if (upiMatcher.find()) {
                details.upiId = upiMatcher.group();
            }

            // Determine transaction mode
            if (message.contains("UPI")) {
                details.transactionMode = "UPI";
            } else if (message.contains("NEFT")) {
                details.transactionMode = "NEFT";
            } else if (message.contains("IMPS")) {
                details.transactionMode = "IMPS";
            } else {
                details.transactionMode = "OTHER";
            }

            // Extract merchant name
            if (details.upiId != null) {
                Pattern merchantPattern = Pattern.compile("(?i)(?:to|from)\\s+([\\w\\s]+)\\s+(?:via|through|using|by)");
                Matcher merchantMatcher = merchantPattern.matcher(message);
                if (merchantMatcher.find()) {
                    details.merchantName = merchantMatcher.group(1).trim();
                } else {
                    details.merchantName = details.upiId;
                }
            } else {
                details.merchantName = "Unknown";
            }

            return details;
        } catch (Exception e) {
            Log.e(TAG, "Error extracting transaction details", e);
            return null;
        }
    }

    private static class TransactionDetails {
        boolean isDebit;
        double amount;
        String accountNumber = "";
        String merchantName = "";
        String transactionMode = "";
        String upiId = "";
    }
} 