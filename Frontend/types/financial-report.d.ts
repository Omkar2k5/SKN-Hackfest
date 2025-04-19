export interface IncomeData {
  name: string
  value: number
}

export interface ExpenseData {
  name: string
  value: number
}

export interface FinancialReportPDFProps {
  dateRange: {
    from: Date
    to: Date
  }
  totalIncome: number
  incomeChange: number
  creditTransactions: Array<{
    accountNumber: string
    amount: number
    merchantName: string
    timestamp: number
    transactionMode: string
    upiId?: string
  }>
  incomeData: IncomeData[]
  expenseData: ExpenseData[]
}

export declare function FinancialReportPDF(props: FinancialReportPDFProps): JSX.Element 