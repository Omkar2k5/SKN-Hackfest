import { format, parse } from 'date-fns';
import { BankStatement, Transaction, StatementParsingResult } from './types';
import { storeTransactionsInFirebase } from './firebase-transactions';
import { Transaction as FinanceTransaction } from '@/types/finance';
import { Transaction as ParsedTransaction } from '@/lib/types';

/**
 * Parse a Kotak Mahindra Bank statement text and extract account details and transactions
 * 
 * @param text - The raw text extracted from the bank statement PDF
 * @returns A result object containing the parsed statement and extracted transactions
 */
export async function parseKotakStatement(text: string, userId?: string): Promise<StatementParsingResult> {
  try {
    console.log('Parsing Kotak Bank statement...');
    
    // Check if it's a Kotak statement
    if (!text.includes('KOTAK') && !text.includes('Kotak Mahindra Bank')) {
      return {
        success: false,
        message: 'Not a Kotak Mahindra Bank statement',
        error: 'Unsupported bank statement format'
      };
    }
    
    // Create a result object
    const result: StatementParsingResult = {
      success: false,
      message: 'Processing statement...',
    };
    
    // Extract statement header information
    const accountMatch = text.match(/Account No\s*:\s*([0-9]+)/i);
    const periodMatch = text.match(/Period\s*:\s*(\d{1,2}-\d{1,2}-\d{4})\s*to\s*(\d{1,2}-\d{1,2}-\d{4})/i);
    const customerMatch = text.match(/([A-Za-z\s]+)\s*\d+\s*[A-Za-z\s,\-]+(MAHARASHTRA|SOLAPUR)/i);
    
    // Extract summary information
    const openingBalanceMatch = text.match(/Opening Balance\s*:\s*([0-9,.]+)\(([A-Za-z]+)\)/i);
    const closingBalanceMatch = text.match(/Closing Balance\s*:\s*([0-9,.]+)\(([A-Za-z]+)\)/i);
    const totalWithdrawalMatch = text.match(/Total Withdrawal Amount\s*:\s*([0-9,.]+)\(([A-Za-z]+)\)/i);
    const totalDepositMatch = text.match(/Total Deposit Amount\s*:\s*([0-9,.]+)\(([A-Za-z]+)\)/i);
    const withdrawalCountMatch = text.match(/Withdrawal Count\s*:\s*(\d+)/i);
    const depositCountMatch = text.match(/Deposit Count\s*:\s*(\d+)/i);
    
    // Create a statement object with extracted details
    const statement: BankStatement = {
      accountNumber: accountMatch ? accountMatch[1] : 'Unknown',
      customerName: customerMatch ? customerMatch[1].trim() : 'Unknown',
      period: {
        from: periodMatch ? parse(periodMatch[1], 'dd-MM-yyyy', new Date()) : new Date(),
        to: periodMatch ? parse(periodMatch[2], 'dd-MM-yyyy', new Date()) : new Date(),
      },
      openingBalance: openingBalanceMatch ? parseFloat(openingBalanceMatch[1].replace(/,/g, '')) : 0,
      closingBalance: closingBalanceMatch ? parseFloat(closingBalanceMatch[1].replace(/,/g, '')) : 0,
      totalWithdrawal: totalWithdrawalMatch ? parseFloat(totalWithdrawalMatch[1].replace(/,/g, '')) : 0,
      totalDeposit: totalDepositMatch ? parseFloat(totalDepositMatch[1].replace(/,/g, '')) : 0,
      withdrawalCount: withdrawalCountMatch ? parseInt(withdrawalCountMatch[1]) : 0,
      depositCount: depositCountMatch ? parseInt(depositCountMatch[1]) : 0,
      transactions: [],
    };
    
    // Extract transactions
    // Split text into lines
    const lines = text.split('\n');
    const transactions: Transaction[] = [];
    
    // Regex pattern to match transaction lines from Kotak statement format
    const txPattern = /(\d{1,2}-\d{1,2}-\d{4})\s+([^/]+?)\s+([A-Z0-9-]+)\s+([0-9,.]+)(?:\(([A-Za-z]+)\))?\s+([0-9,.]+)(?:\(([A-Za-z]+)\))?/i;
    
    console.log(`Processing ${lines.length} lines for transactions`);
    
    for (const line of lines) {
      const match = line.match(txPattern);
      if (match) {
        try {
          // Extract matched groups
          const [_, dateStr, description, refNo, amountStr, amountType, balanceStr, balanceType] = match;
          
          // Parse date
          const timestamp = parse(dateStr, 'dd-MM-yyyy', new Date()).getTime();
          
          // Clean description
          const merchantName = description.trim();
          
          // Determine amount and if it's credit or debit
          const isDebit = amountType === 'Dr' || line.includes('(Dr)');
          const amount = parseFloat(amountStr.replace(/,/g, '')) * (isDebit ? -1 : 1);
          
          // Determine transaction mode based on description
          let transactionMode = 'BANK_TRANSFER';
          let upiId: string | undefined;
          
          if (description.includes('UPI')) {
            transactionMode = 'UPI';
            // Try to extract UPI ID if present
            const upiMatch = description.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+)/i);
            if (upiMatch) {
              upiId = upiMatch[1];
            }
          } else if (description.includes('NEFT')) {
            transactionMode = 'NEFT';
          } else if (description.includes('IMPS')) {
            transactionMode = 'IMPS';
          } else if (description.includes('ATM')) {
            transactionMode = 'ATM';
          } else if (description.includes('POS') || description.includes('CARD')) {
            transactionMode = 'POS';
          } else if (description.includes('CASH')) {
            transactionMode = 'CASH';
          } else if (description.includes('CHEQUE') || description.includes('CHQ')) {
            transactionMode = 'CHEQUE';
          }
          
          console.log(`Found transaction: ${merchantName}, ${amount}, ${format(timestamp, 'dd/MM/yyyy')}`);
          
          // Create transaction object
          const transaction: Transaction = {
            merchantName,
            amount,
            timestamp,
            transactionMode,
            accountNumber: statement.accountNumber,
            ...(upiId && { upiId }),
          };
          
          transactions.push(transaction);
        } catch (error) {
          console.error('Error processing transaction line:', error);
          continue;
        }
      }
    }
    
    // Update the statement with transactions
    statement.transactions = transactions;
    
    // Store transactions in Firebase if requested
    if (userId && transactions.length > 0) {
      try {
        const financeTransactions: FinanceTransaction[] = transactions.map(tx => ({
          accountNumber: tx.accountNumber || 'Unknown',
          amount: tx.amount,
          merchantName: tx.merchantName,
          timestamp: tx.timestamp,
          transactionMode: tx.transactionMode,
          type: tx.amount >= 0 ? 'credit' as const : 'debit' as const,
          ...(tx.upiId ? { upiId: tx.upiId } : {})
        }));

        await storeTransactionsInFirebase(financeTransactions, userId);
        console.log(`Stored ${transactions.length} transactions in Firebase for user ${userId}`);
      } catch (error) {
        console.error('Error storing transactions in Firebase:', error);
        // Continue anyway as we still want to return the parsed data
      }
    }
    
    // Return the result
    return {
      success: true,
      message: `Successfully parsed statement with ${transactions.length} transactions`,
      statement,
      transactions,
    };
  } catch (error) {
    console.error('Error parsing Kotak statement:', error);
    return {
      success: false,
      message: 'Failed to parse statement',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function parseAndStoreStatement(
  text: string,
  userId?: string
): Promise<ParsedTransaction[]> {
  try {
    const result = await parseKotakStatement(text, userId);
    if (!result.success || !result.transactions) {
      throw new Error(result.message || 'Failed to parse statement');
    }

    console.log(`Parsed ${result.transactions.length} transactions from statement`);

    // Convert transactions to the finance type before storing
    if (userId && result.transactions.length > 0) {
      try {
        const financeTransactions: FinanceTransaction[] = result.transactions.map((tx: ParsedTransaction) => ({
          accountNumber: tx.accountNumber || 'Unknown',
          amount: tx.amount,
          merchantName: tx.merchantName,
          timestamp: tx.timestamp,
          transactionMode: tx.transactionMode,
          type: tx.amount >= 0 ? 'credit' as const : 'debit' as const,
          ...(tx.upiId ? { upiId: tx.upiId } : {})
        }));

        await storeTransactionsInFirebase(financeTransactions, userId);
        console.log(`Stored ${result.transactions.length} transactions in Firebase for user ${userId}`);
      } catch (error) {
        console.error('Error storing transactions in Firebase:', error);
      }
    }

    return result.transactions;
  } catch (error) {
    console.error('Error parsing statement:', error);
    throw error;
  }
} 