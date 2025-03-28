"use client"

import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  IndianRupee,
  HelpCircle,
  LineChart,
  Plus,
  Wallet,
} from "lucide-react"
import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { subMonths } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DashboardChart } from "@/components/dashboard-chart"
import { DashboardNav } from "@/components/dashboard-nav"
import { ExpensePieChart } from "@/components/expense-pie-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { BudgetStatus } from "@/components/budget-status"

interface Transaction {
  accountNumber: string
  amount: number
  merchantName: string
  timestamp: number
  transactionMode: string
  upiId?: string
}

export default function DashboardPage() {
  const [totalBalance, setTotalBalance] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [incomeChange, setIncomeChange] = useState(0)
  const [expenseChange, setExpenseChange] = useState(0)
  const [balanceChange, setBalanceChange] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Update balance whenever income or expenses change
  useEffect(() => {
    const balance = totalIncome - totalExpenses
    setTotalBalance(balance)
    
    // Calculate balance change percentage
    const balanceChangePercent = totalIncome > 0 
      ? ((balance / totalIncome) * 100)
      : 0
    setBalanceChange(Number(balanceChangePercent.toFixed(1)))
  }, [totalIncome, totalExpenses])

  useEffect(() => {
    try {
      const creditRef = ref(database, 'credit')
      const debitRef = ref(database, 'debit')

      // Listen for credit transactions
      onValue(creditRef, (snapshot: DataSnapshot) => {
        try {
          const creditData = snapshot.val() as Record<string, Transaction> | null
          
          if (creditData) {
            const creditTotal = Object.values(creditData).reduce((sum, transaction) => 
              sum + transaction.amount, 0)
            setTotalIncome(creditTotal)
            
            // Calculate month-over-month change
            const currentMonth = new Date().getMonth()
            const currentMonthTransactions = Object.values(creditData).filter(tx => 
              new Date(tx.timestamp).getMonth() === currentMonth
            )
            const lastMonthTransactions = Object.values(creditData).filter(tx => 
              new Date(tx.timestamp).getMonth() === currentMonth - 1
            )
            
            const currentMonthTotal = currentMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0)
            const lastMonthTotal = lastMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0)
            
            const change = lastMonthTotal > 0 
              ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
              : 0
            setIncomeChange(Number(change.toFixed(1)))
          } else {
            // Reset income if no data
            setTotalIncome(0)
          }
        } catch (err) {
          console.error('Error processing credit data:', err)
          setError('Error loading income data')
        }
      })

      // Listen for debit transactions
      onValue(debitRef, (snapshot: DataSnapshot) => {
        try {
          const debitData = snapshot.val() as Record<string, Transaction> | null
          
          if (debitData) {
            const debitTotal = Object.values(debitData).reduce((sum, transaction) => 
              sum + transaction.amount, 0)
            setTotalExpenses(debitTotal)
            
            // Calculate month-over-month change
            const currentMonth = new Date().getMonth()
            const currentMonthTransactions = Object.values(debitData).filter(tx => 
              new Date(tx.timestamp).getMonth() === currentMonth
            )
            const lastMonthTransactions = Object.values(debitData).filter(tx => 
              new Date(tx.timestamp).getMonth() === currentMonth - 1
            )
            
            const currentMonthTotal = currentMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0)
            const lastMonthTotal = lastMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0)
            
            const change = lastMonthTotal > 0 
              ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
              : 0
            setExpenseChange(Number(change.toFixed(1)))
          } else {
            // Reset expenses if no data
            setTotalExpenses(0)
          }
        } catch (err) {
          console.error('Error processing debit data:', err)
          setError('Error loading expense data')
        }
      })
    } catch (err) {
      console.error('Error setting up Firebase listeners:', err)
      setError('Error connecting to database')
    }
  }, []) // Empty dependency array as we want this to run once on mount

  // Add a refresh button to manually trigger data fetch
  const handleRefresh = () => {
    console.log('Manual refresh triggered')
    const balance = totalIncome - totalExpenses
    setTotalBalance(balance)
    
    const balanceChangePercent = totalIncome > 0 
      ? ((balance / totalIncome) * 100)
      : 0
    setBalanceChange(Number(balanceChangePercent.toFixed(1)))
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
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
          <Link href="/" className="flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FinanceBuddy</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <LineChart className="h-5 w-5" />
              <span className="sr-only">Refresh</span>
            </Button>
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
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, John! Here's an overview of your finances.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">{balanceChange >= 0 ? '+' : ''}{balanceChange}% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Income</CardTitle>
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">{incomeChange >= 0 ? '+' : ''}{incomeChange}% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                  <ArrowDown className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">{expenseChange >= 0 ? '+' : ''}{expenseChange}% from last month</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Monthly Overview</CardTitle>
                  <CardDescription>Your financial activity for the past 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <DashboardChart />
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                  <CardDescription>Top merchants by spending amount</CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpensePieChart />
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your latest financial activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentTransactions />
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Budget Status</CardTitle>
                  <CardDescription>Your spending by merchant</CardDescription>
                </CardHeader>
                <CardContent>
                  <BudgetStatus />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

