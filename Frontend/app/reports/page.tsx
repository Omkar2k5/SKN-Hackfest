"use client"

import Link from "next/link"
import { IndianRupee, Download, Filter, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardChart } from "@/components/dashboard-chart"
import { ExpensePieChart } from "@/components/expense-pie-chart"

interface Transaction {
  accountNumber: string
  amount: number
  merchantName: string
  timestamp: number
  transactionMode: string
  upiId?: string
}

export default function ReportsPage() {
  const [creditTransactions, setCreditTransactions] = useState<Transaction[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [incomeChange, setIncomeChange] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const creditRef = ref(database, 'credit')

      onValue(creditRef, (snapshot: DataSnapshot) => {
        try {
          const creditData = snapshot.val() as Record<string, Transaction> | null
          
          if (creditData) {
            const transactions = Object.values(creditData)
              .sort((a, b) => b.timestamp - a.timestamp)
            
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
          } else {
            setCreditTransactions([])
            setTotalIncome(0)
            setIncomeChange(0)
          }
        } catch (err) {
          console.error('Error processing credit data:', err)
          setError('Error loading income data')
        }
      })
    } catch (err) {
      console.error('Error setting up Firebase listener:', err)
      setError('Error connecting to database')
    }
  }, [])

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
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Date Range
              </Button>
              <Button size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
                <CardDescription>Your financial activity for the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Your spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpensePieChart />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income Analysis</CardTitle>
              <CardDescription>Your income sources and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Income</p>
                    <p className="text-2xl font-bold">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${incomeChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {incomeChange >= 0 ? '+' : ''}{incomeChange}%
                    </p>
                    <p className="text-sm text-muted-foreground">vs last month</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {creditTransactions.length === 0 ? (
                    <p className="text-center text-muted-foreground">No transactions found</p>
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
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
} 