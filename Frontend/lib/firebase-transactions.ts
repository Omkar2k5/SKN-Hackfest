import { ref, set, push, Database } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Transaction, TransactionType } from '@/types/finance';
import { Transaction as PDFTransaction } from '@/lib/pdf-extractor';

/**
 * Store an array of transactions in Firebase
 * This function stores transactions in the appropriate credit/debit node based on amount
 * 
 * @param transactions - Array of transactions from the pdf-extractor
 * @param userId - The user ID to associate these transactions with (optional)
 * @returns Promise that resolves when all transactions are stored
 */
export async function storeTransactionsInFirebase(
  transactions: Transaction[],
  userId?: string
): Promise<void> {
  console.log(`Storing ${transactions.length} transactions in Firebase`);
  
  const db = database;
  if (!db) {
    throw new Error('Firebase database not initialized');
  }

  try {
    const promises = transactions.map(async (transaction) => {
      // Determine if it's credit or debit based on amount
      const type = transaction.amount >= 0 ? 'credit' : 'debit';
      
      // If debit, ensure amount is positive for storage (the UI will show it as negative)
      const amount = Math.abs(transaction.amount);
      
      // Prepare the transaction data for storage
      const transactionData = {
        ...transaction,
        amount, // Store absolute value
        // Add timestamp if not present (should be present from the extractor)
        timestamp: transaction.timestamp || Date.now(),
        // Add accountNumber if not present
        accountNumber: transaction.accountNumber || 'Unknown',
      };
      
      // Create a reference to the appropriate node
      const basePath = userId ? `users/${userId}/${type}` : type;
      const transactionsRef = ref(db, basePath);
      
      // Use push to create a unique ID for each transaction
      const newTransactionRef = push(transactionsRef);
      
      // Set the data at the new ref
      await set(newTransactionRef, transactionData);
      
      return transactionData;
    });
    
    await Promise.all(promises);
    console.log('All transactions stored successfully');
  } catch (error) {
    console.error('Error storing transactions:', error);
    throw error;
  }
}

/**
 * Process text from a bank statement and store the extracted transactions in Firebase
 * 
 * @param text - The text content of the bank statement
 * @param userId - Optional user ID to associate the transactions with
 * @returns Promise that resolves to the extracted transactions
 */
export async function processAndStoreTransactions(
  text: string,
  userId?: string
): Promise<Transaction[]> {
  try {
    // Import the extractTransactions function
    const { extractTransactions } = await import('./pdf-extractor');
    
    // Extract transactions from the text and convert to the correct type
    const extractedTransactions = extractTransactions(text);
    const transactions: Transaction[] = extractedTransactions.map(tx => ({
      accountNumber: tx.accountNumber || 'Unknown', // Provide default value
      amount: tx.amount,
      merchantName: tx.merchantName,
      timestamp: tx.timestamp,
      transactionMode: tx.transactionMode,
      type: tx.amount >= 0 ? 'credit' as const : 'debit' as const,
      ...(tx.upiId ? { upiId: tx.upiId } : {}) // Only include if defined
    }));
    
    console.log(`Extracted ${transactions.length} transactions from text`);
    
    // Store the transactions in Firebase
    if (transactions.length > 0) {
      await storeTransactionsInFirebase(transactions, userId);
    }
    
    return transactions;
  } catch (error) {
    console.error('Error processing and storing transactions:', error);
    throw error;
  }
}

export const addTransaction = async (
  transaction: Omit<Transaction, 'id' | 'timestamp'>,
  type: TransactionType,
  userId?: string
) => {
  const db = database;
  if (!db) {
    throw new Error('Firebase database not initialized');
  }

  try {
    // Create a reference to the appropriate node
    const basePath = userId ? `users/${userId}/${type}` : type;
    const transactionsRef = ref(db, basePath);

    // Use push to create a unique ID for each transaction
    const newTransactionRef = push(transactionsRef);

    // Set the data at the new ref
    await set(newTransactionRef, {
      ...transaction,
      timestamp: Date.now()
    });

    return { id: newTransactionRef.key };
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const processTransactions = (pdfTransactions: PDFTransaction[]): Omit<Transaction, 'id'>[] => {
  return pdfTransactions.map(tx => ({
    accountNumber: tx.accountNumber || '',
    amount: tx.amount,
    merchantName: tx.merchantName,
    timestamp: tx.timestamp,
    transactionMode: tx.transactionMode,
    type: tx.amount > 0 ? 'credit' as const : 'debit' as const,
    ...(tx.upiId && { upiId: tx.upiId })
  }));
}; 