"use client"

import Link from "next/link"
import { IndianRupee, Download, Filter, Calendar } from "lucide-react"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, subDays, subWeeks, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardChart } from "@/components/dashboard-chart"
import ExpensePieChart from "@/components/expense-pie-chart"
import { useFinance } from "@/hooks/useFinance"
import { Transaction, MerchantExpense } from "@/types/finance"

const PRESET_RANGES = [
  { label: "Last 5 Days", getRange: () => ({ from: subDays(new Date(), 5), to: new Date() }) },
  { label: "Last Week", getRange: () => ({ from: subWeeks(new Date(), 1), to: new Date() }) },
  { label: "Last Month", getRange: () => ({ from: subMonths(new Date(), 1), to: new Date() }) },
  { label: "This Month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Custom Range", getRange: null }
]

export default function ReportsPage() {
  const router = useRouter()
  const auth = getAuth()
  const [user, setUser] = useState(auth.currentUser)
  const {
    loading: dataLoading,
    error: dataError,
    credits,
    debits,
    refresh
  } = useFinance()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [selectedPreset, setSelectedPreset] = useState<string>("Last 30 Days")
  const [incomeData, setIncomeData] = useState<MerchantExpense[]>([])
  const [expenseData, setExpenseData] = useState<MerchantExpense[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [incomeChange, setIncomeChange] = useState(0)
  const incomePieRef = useRef<HTMLDivElement>(null)
  const expensePieRef = useRef<HTMLDivElement>(null)

  // Handle authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [auth, router])

  // Process transactions when data or date range changes
  useEffect(() => {
    if (credits && debits) {
      // Filter transactions by date range
      const filteredCredits = credits.filter(tx => {
        const txDate = new Date(tx.timestamp)
        return isWithinInterval(txDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to)
        })
      })

      const filteredDebits = debits.filter(tx => {
        const txDate = new Date(tx.timestamp)
        return isWithinInterval(txDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to)
        })
      })

      // Calculate total income and income change
      const total = filteredCredits.reduce((sum, tx) => sum + tx.amount, 0)
      setTotalIncome(total)

      // Calculate month-over-month change
      const currentMonth = new Date().getMonth()
      const currentMonthCredits = filteredCredits.filter(tx => 
        new Date(tx.timestamp).getMonth() === currentMonth
      )
      const lastMonthCredits = filteredCredits.filter(tx => 
        new Date(tx.timestamp).getMonth() === currentMonth - 1
      )
      
      const currentMonthTotal = currentMonthCredits.reduce((sum, tx) => sum + tx.amount, 0)
      const lastMonthTotal = lastMonthCredits.reduce((sum, tx) => sum + tx.amount, 0)
      
      const change = lastMonthTotal > 0 
        ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
        : 0
      setIncomeChange(Number(change.toFixed(1)))

      // Calculate income by source
      const incomeBySource = filteredCredits.reduce((acc, tx) => {
        const merchant = tx.merchantName
        acc[merchant] = (acc[merchant] || 0) + tx.amount
        return acc
      }, {} as Record<string, number>)

      const incomeDataArray = Object.entries(incomeBySource)
        .map(([merchant, amount]) => ({ merchant, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5) // Top 5 sources

      setIncomeData(incomeDataArray)

      // Calculate expenses by category
      const expensesByCategory = filteredDebits.reduce((acc, tx) => {
        const merchant = tx.merchantName
        acc[merchant] = (acc[merchant] || 0) + tx.amount
        return acc
      }, {} as Record<string, number>)

      const expenseDataArray = Object.entries(expensesByCategory)
        .map(([merchant, amount]) => ({ merchant, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5) // Top 5 categories

      setExpenseData(expenseDataArray)
    }
  }, [credits, debits, dateRange])

  // Handle preset selection
  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset)
    const selectedRange = PRESET_RANGES.find(range => range.label === preset)
    if (selectedRange && selectedRange.getRange) {
      setDateRange(selectedRange.getRange())
    }
  }

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refresh()
    } catch (err) {
      setError('Failed to refresh data')
    }
  }, [refresh])

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || dataError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || dataError}</p>
          <Button onClick={handleRefresh} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Link href="/home" className="flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FinanceBuddy</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <Download className="h-5 w-5" />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  width={32}
                  height={32}
                  alt="Avatar"
                  className="rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
              )}
              <span>{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
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
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
                <CardDescription>Your financial activity for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardChart data={[]} />
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
                        <p className="text-2xl font-bold text-rose-600">₹{expenseData.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-rose-600">
                          {((expenseData.reduce((sum, item) => sum + item.amount, 0) / totalIncome) * 100).toFixed(1)}%
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
                  <ExpensePieChart data={incomeData} />
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
                  <ExpensePieChart data={expenseData} />
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
                {!credits || credits.length === 0 ? (
                  <p className="text-center text-muted-foreground">No transactions found for the selected period</p>
                ) : (
                  credits.slice(0, 5).map((transaction, index) => (
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