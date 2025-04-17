export interface BaseTransaction {
  accountNumber: string
  amount: number
  merchantName: string
  timestamp: number
  transactionMode: string
  upiId?: string
}

export interface Transaction extends BaseTransaction {
  type: 'credit' | 'debit'
}

export interface Budget {
  id?: string
  amount: number
  budgetReached: boolean
  category: string
  createdAt: number
  description: string
  isActive: boolean
  merchants: string[]
  spent: number
  upiIds?: string[]
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
}

export interface MerchantExpense {
  merchant: string
  amount: number
  percentage?: number
}

export interface FinanceSummary {
  totalCredit: number
  totalDebit: number
  balance: number
  totalBudget: number
  totalSpent: number
  budgetUtilization: number
  transactionCount: number
  activeBudgetCount: number
  totalBudgetCount: number
}

export type TransactionType = 'credit' | 'debit' 