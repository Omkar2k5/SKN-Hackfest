"use client"

import Link from "next/link"
import { IndianRupee, Download, Filter, Calendar } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, subDays, subWeeks, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { PDFDownloadLink as PDFDownloadLinkBase } from '@react-pdf/renderer'
import type { ComponentType } from 'react'
import { toPng } from 'html-to-image'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardChart } from "@/components/dashboard-chart"
import { ExpensePieChart } from "@/components/expense-pie-chart"
import { IncomePieChart } from "@/components/income-piechart"
import { FinancialReportPDF } from "@/components/financial-report-pdf"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"

interface Transaction {
  accountNumber: string
  amount: number
  merchantName: string
  timestamp: number
  transactionMode: string
  upiId?: string
}

interface IncomeData {
  name: string;
  value: number;
}

interface ExpenseData {
  name: string;
  value: number;
}

const PRESET_RANGES = [
  { label: "Last 5 Days", getRange: () => ({ from: subDays(new Date(), 5), to: new Date() }) },
  { label: "Last Week", getRange: () => ({ from: subWeeks(new Date(), 1), to: new Date() }) },
  { label: "Last Month", getRange: () => ({ from: subMonths(new Date(), 1), to: new Date() }) },
  { label: "This Month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Custom Range", getRange: null }
]

const PDFDownloadLink = PDFDownloadLinkBase as ComponentType<any>;

export default function ReportsPage() {
  const [creditTransactions, setCreditTransactions] = useState<Transaction[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [incomeChange, setIncomeChange] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedPreset, setSelectedPreset] = useState<string>("Last 30 Days")
  const [incomeData, setIncomeData] = useState<IncomeData[]>([])
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([])
  const incomePieRef = useRef<HTMLDivElement>(null)
  const expensePieRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const creditRef = ref(database, 'credit')
      const debitRef = ref(database, 'debit')

      // Fetch credit transactions
      onValue(creditRef, (snapshot: DataSnapshot) => {
        try {
          const creditData = snapshot.val() as Record<string, Transaction> | null
          
          if (creditData) {
            const transactions = Object.values(creditData)
              .sort((a, b) => b.timestamp - a.timestamp)
              .filter(transaction => {
                const transactionDate = new Date(transaction.timestamp)
                return isWithinInterval(transactionDate, {
                  start: startOfDay(dateRange.from),
                  end: endOfDay(dateRange.to)
                })
              })
            
            setCreditTransactions(transactions)
            
            // Calculate total income
            const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)
            setTotalIncome(total)
            
            // Calculate month-over-month change
            const currentMonth = new Date().getMonth()
            const currentMonthTransactions = transactions.filter(tx => 
              new Date(tx.timestamp).getMonth() === currentMonth
            )
            const lastMonthTransactions = transactions.filter(tx => 
              new Date(tx.timestamp).getMonth() === currentMonth - 1
            )
            
            const currentMonthTotal = currentMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0)
            const lastMonthTotal = lastMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0)
            
            const change = lastMonthTotal > 0 
              ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
              : 0
            setIncomeChange(Number(change.toFixed(1)))

            // Calculate income by source
            const incomeBySource = transactions.reduce((acc, tx) => {
              const source = tx.merchantName
              acc[source] = (acc[source] || 0) + tx.amount
              return acc
            }, {} as Record<string, number>)

            const incomeDataArray = Object.entries(incomeBySource).map(([name, value]) => ({
              name,
              value
            }))

            setIncomeData(incomeDataArray)
          } else {
            setCreditTransactions([])
            setTotalIncome(0)
            setIncomeChange(0)
            setIncomeData([])
          }
        } catch (err) {
          console.error('Error processing credit data:', err)
          setError('Error loading income data')
        }
      })

      // Fetch debit transactions
      onValue(debitRef, (snapshot: DataSnapshot) => {
        try {
          const debitData = snapshot.val() as Record<string, Transaction> | null
          
          if (debitData) {
            const transactions = Object.values(debitData)
              .filter(transaction => {
                const transactionDate = new Date(transaction.timestamp)
                return isWithinInterval(transactionDate, {
                  start: startOfDay(dateRange.from),
                  end: endOfDay(dateRange.to)
                })
              })

            // Calculate expenses by category
            const expensesByCategory = transactions.reduce((acc, tx) => {
              const category = tx.merchantName
              acc[category] = (acc[category] || 0) + tx.amount
              return acc
            }, {} as Record<string, number>)

            const expenseDataArray = Object.entries(expensesByCategory).map(([name, value]) => ({
              name,
              value
            }))

            setExpenseData(expenseDataArray)
          } else {
            setExpenseData([])
          }
        } catch (err) {
          console.error('Error processing debit data:', err)
          setError('Error loading expense data')
        }
      })
    } catch (err) {
      console.error('Error setting up Firebase listener:', err)
      setError('Error connecting to database')
    }
  }, [dateRange])

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset)
    const selectedRange = PRESET_RANGES.find(range => range.label === preset)
    if (selectedRange && selectedRange.getRange) {
      setDateRange(selectedRange.getRange())
    }
  }

  const handleDownloadReport = async () => {
    try {
      // Capture income pie chart
      if (incomePieRef.current) {
        const incomeChartImage = await toPng(incomePieRef.current)
      }
      
      // Capture expense pie chart
      if (expensePieRef.current) {
        const expenseChartImage = await toPng(expensePieRef.current)
      }

      // Pass these images to the PDF component
      // ... rest of the PDF generation code
    } catch (error) {
      console.error('Error generating chart images:', error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FinanceBuddy</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2">
              <img
                src="/placeholder.svg?height=32&width=32"
                width={32}
                height={32}
                alt="Avatar"
                className="rounded-full"
              />
              <span>John Doe</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="grid flex-1 md:grid-cols-[240px_1fr]">
        <DashboardNav className="hidden border-r md:block" />
        <main className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
              <p className="text-muted-foreground">View and analyze your financial data</p>
            </div>
            <div className="flex items-center gap-2">
              <PDFDownloadLink
                document={
                  <FinancialReportPDF
                    dateRange={dateRange}
                    totalIncome={totalIncome}
                    incomeChange={incomeChange}
                    creditTransactions={creditTransactions}
                    incomeData={incomeData}
                    expenseData={expenseData}
                  />
                }
                fileName={`financial-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
              >
                {({ loading }: { loading: boolean }) => (
                  <Button size="sm" disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? 'Generating Report...' : 'Download Report'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
                <CardDescription>Your financial activity for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analysis</CardTitle>
                <CardDescription>Overview of your income and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Income Analysis */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Income Overview</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Income</p>
                        <p className="text-2xl font-bold text-emerald-600">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${incomeChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {incomeChange >= 0 ? '+' : ''}{incomeChange}%
                        </p>
                        <p className="text-sm text-muted-foreground">vs last month</p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border" />

                  {/* Expense Analysis */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Expense Overview</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Expenses</p>
                        <p className="text-2xl font-bold text-rose-600">₹{expenseData.reduce((sum, item) => sum + item.value, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-rose-600">
                          {((expenseData.reduce((sum, item) => sum + item.value, 0) / totalIncome) * 100).toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">of total income</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income Sources</CardTitle>
                <CardDescription>Breakdown of your income by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={incomePieRef}>
                  <IncomePieChart />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Your spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={expensePieRef}>
                  <ExpensePieChart />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Income Transactions</CardTitle>
              <CardDescription>Your latest income transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creditTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground">No transactions found for the selected period</p>
                ) : (
                  creditTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={`${transaction.timestamp}-${index}`} className="space-y-1 border-b pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{transaction.merchantName}</span>
                        <span className="text-emerald-600">+₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                        <span>{transaction.transactionMode}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span>A/C: {transaction.accountNumber}</span>
                        {transaction.upiId && <span> • UPI: {transaction.upiId}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
} 