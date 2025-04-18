import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Style } from '@react-pdf/types';
import type { ComponentType } from 'react';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    color: '#1e40af',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#f8fafc',
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#1e40af',
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
    width: '100%',
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'medium',
    flex: 1,
  },
  valueContainer: {
    minWidth: 120,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
  },
  valuePositive: {
    color: '#10B981',
  },
  valueNegative: {
    color: '#EF4444',
  },
  transaction: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    width: '100%',
  },
  transactionDetails: {
    fontSize: 10,
    color: '#64748b',
  },
  dateRange: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 20,
    backgroundColor: '#f1f5f9',
    padding: 8,
    textAlign: 'center',
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 15,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    minWidth: 120,
  },
  summaryValuePositive: {
    color: '#10B981',
  },
  summaryValueNegative: {
    color: '#EF4444',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#64748b',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    padding: 8,
    backgroundColor: '#f8f9fa',
  },
  transactionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  transactionCategory: {
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionDate: {
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
  },
});

// Add type declarations for PDF components
const PDFDocument = Document as ComponentType<any>;
const PDFPage = Page as ComponentType<any>;
const PDFView = View as ComponentType<any>;
const PDFText = Text as ComponentType<any>;

interface Transaction {
  accountNumber: string;
  amount: number;
  merchantName: string;
  timestamp: number;
  transactionMode: string;
  upiId?: string;
}

interface IncomeData {
  name: string;
  value: number;
}

interface ExpenseData {
  name: string;
  value: number;
}

interface FinancialReportPDFProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  totalIncome: number;
  incomeChange: number;
  creditTransactions: Transaction[];
  incomeData: IncomeData[];
  expenseData: ExpenseData[];
}

export const FinancialReportPDF = ({
  dateRange,
  totalIncome,
  incomeChange,
  creditTransactions,
  incomeData,
  expenseData,
}: FinancialReportPDFProps) => {
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <PDFDocument>
      <PDFPage size="A4" style={styles.page}>
        <PDFView style={styles.header}>
          <PDFText style={styles.title}>Financial Report</PDFText>
          <PDFText style={styles.subtitle}>Generated on {format(new Date(), 'MMMM dd, yyyy')}</PDFText>
        </PDFView>

        <PDFView style={styles.dateRange}>
          <PDFText>Report Period: {format(dateRange.from, 'MMMM dd, yyyy')} - {format(dateRange.to, 'MMMM dd, yyyy')}</PDFText>
        </PDFView>

        <PDFView style={styles.summaryBox}>
          <PDFView style={styles.summaryItem}>
            <PDFText style={styles.summaryLabel}>Total Income</PDFText>
            <PDFText style={[styles.summaryValue, styles.summaryValuePositive]}>
              ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </PDFText>
          </PDFView>
          <PDFView style={styles.summaryItem}>
            <PDFText style={styles.summaryLabel}>Total Expenses</PDFText>
            <PDFText style={[styles.summaryValue, styles.summaryValueNegative]}>
              ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </PDFText>
          </PDFView>
          <PDFView style={styles.summaryItem}>
            <PDFText style={styles.summaryLabel}>Net Income</PDFText>
            <PDFText style={[styles.summaryValue, netIncome >= 0 ? styles.summaryValuePositive : styles.summaryValueNegative]}>
              ₹{netIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </PDFText>
          </PDFView>
        </PDFView>

        <PDFView style={styles.section}>
          <PDFText style={styles.sectionTitle}>Income Overview</PDFText>
          <PDFView style={styles.row}>
            <PDFText style={styles.label}>Total Income</PDFText>
            <PDFView style={styles.valueContainer}>
              <PDFText style={[styles.value, styles.valuePositive]}>
                ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </PDFText>
            </PDFView>
          </PDFView>
          <PDFView style={styles.row}>
            <PDFText style={styles.label}>Month-over-Month Change</PDFText>
            <PDFView style={styles.valueContainer}>
              <PDFText style={[styles.value, incomeChange >= 0 ? styles.valuePositive : styles.valueNegative]}>
                {incomeChange >= 0 ? '+' : ''}{incomeChange}%
              </PDFText>
            </PDFView>
          </PDFView>
        </PDFView>

        <PDFView style={styles.section}>
          <PDFText style={styles.sectionTitle}>Income Sources</PDFText>
          {incomeData.map((income, index) => (
            <PDFView key={index} style={styles.row}>
              <PDFText style={styles.label}>{income.name}</PDFText>
              <PDFView style={styles.valueContainer}>
                <PDFText style={[styles.value, styles.valuePositive]}>
                  ₹{income.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </PDFText>
              </PDFView>
            </PDFView>
          ))}
        </PDFView>

        <PDFView style={styles.section}>
          <PDFText style={styles.sectionTitle}>Expense Breakdown</PDFText>
          {expenseData.map((expense, index) => (
            <PDFView key={index} style={styles.row}>
              <PDFText style={styles.label}>{expense.name}</PDFText>
              <PDFView style={styles.valueContainer}>
                <PDFText style={[styles.value, styles.valueNegative]}>
                  ₹{expense.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </PDFText>
              </PDFView>
            </PDFView>
          ))}
        </PDFView>

        <PDFView style={styles.section}>
          <PDFText style={styles.sectionTitle}>Recent Transactions</PDFText>
          {creditTransactions.slice(0, 5).map((transaction, index) => (
            <PDFView key={index} style={styles.transactionRow}>
              <PDFView style={styles.transactionDetails}>
                <PDFText style={styles.transactionTitle}>{transaction.merchantName}</PDFText>
                <PDFText style={styles.transactionCategory}>{transaction.transactionMode}</PDFText>
              </PDFView>
              <PDFView style={styles.transactionAmount}>
                <PDFText style={[styles.value, transaction.amount > 0 ? styles.valuePositive : styles.valueNegative]}>
                  ₹{Math.abs(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </PDFText>
                <PDFText style={styles.transactionDate}>
                  {new Date(transaction.timestamp).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </PDFText>
              </PDFView>
            </PDFView>
          ))}
        </PDFView>

        <PDFText style={styles.footer}>
          This report was generated by FinanceBuddy. All amounts are in Indian Rupees (₹).
        </PDFText>
      </PDFPage>
    </PDFDocument>
  );
}; 