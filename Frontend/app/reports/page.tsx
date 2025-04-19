"use client"

import Link from "next/link"
import { IndianRupee, Download, Filter, Calendar } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { format, isWithinInterval, startOfDay, endOfDay, subDays, subWeeks, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import Image from "next/image"
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardChart } from "@/components/dashboard-chart"
import ExpensePieChart from "@/components/expense-pie-chart"
import { useFinance } from "@/hooks/useFinance"
import { Transaction, MerchantExpense } from "@/types/finance"

// Import types from types directory
import type { PDFViewerProps } from '@/types/pdf-viewer'
import type { DateRangePickerProps } from '@/types/date-range-picker'
import type { FinancialReportPDFProps } from '@/types/financial-report'

// Dynamic imports with type safety and loading states
const DateRangePicker = dynamic<DateRangePickerProps>(
  () => import('@/components/ui/date-range-picker').then(mod => mod.DateRangePicker),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
    </div>
  }
)

const PDFViewer = dynamic<PDFViewerProps>(
  () => import('@/components/pdf-viewer').then(mod => mod.PDFViewer),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }
)

const FinancialReportPDF = dynamic<FinancialReportPDFProps>(
  () => import('@/components/financial-report-pdf').then(mod => mod.FinancialReportPDF),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
    </div>
  }
)

const PRESET_RANGES = [
  { label: "Last 5 Days", getRange: () => ({ from: subDays(new Date(), 5), to: new Date() }) },
  { label: "Last Week", getRange: () => ({ from: subWeeks(new Date(), 1), to: new Date() }) },
  { label: "Last Month", getRange: () => ({ from: subMonths(new Date(), 1), to: new Date() }) },
  { label: "This Month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Custom Range", getRange: null }
] as const

interface ReportDateRange {
  from: Date
  to: Date
}

export default function ReportsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [dateRange, setDateRange] = useState<DateRange>()
  const {
    loading: dataLoading,
    error: dataError,
    credits,
    debits,
    summary,
    refresh
  } = useFinance()

  const [selectedPreset, setSelectedPreset] = useState<string>("Last 30 Days")
  const [incomeData, setIncomeData] = useState<MerchantExpense[]>([])
  const [expenseData, setExpenseData] = useState<MerchantExpense[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [incomeChange, setIncomeChange] = useState(0)
  const incomePieRef = useRef<HTMLDivElement>(null)
  const expensePieRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creditTransactions, setCreditTransactions] = useState<Transaction[]>([])
  const [debitTransactions, setDebitTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // Process transactions when data or date range changes
  useEffect(() => {
    if (credits && debits) {
      // Filter transactions by date range
      const filteredCredits = credits.filter(tx => {
        const txDate = new Date(tx.timestamp)
        return isWithinInterval(txDate, {
          start: startOfDay(dateRange?.from || new Date()),
          end: endOfDay(dateRange?.to || new Date())
        })
      })

      const filteredDebits = debits.filter(tx => {
        const txDate = new Date(tx.timestamp)
        return isWithinInterval(txDate, {
          start: startOfDay(dateRange?.from || new Date()),
          end: endOfDay(dateRange?.to || new Date())
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
  const handleRefresh = () => {
    if (!user) return
    refresh()
  }

  // Convert DateRange to ReportDateRange
  const getValidDateRange = (range: DateRange | undefined): ReportDateRange | null => {
    if (!range?.from || !range?.to) return null;
    return {
      from: range.from,
      to: range.to
    };
  };

  // Only render PDF if we have a complete date range
  const validDateRange = dateRange ? getValidDateRange(dateRange) : null;
  const canRenderPDF = credits && debits && summary && validDateRange;

  if (isLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{dataError}</p>
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
            <Image 
              src="/images/finance-logo.png" 
              alt="FinanceBuddy Logo" 
              width={40} 
              height={40} 
              className="object-contain"
              priority
            />
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
              <p className="text-muted-foreground">Generate and download detailed financial reports</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>Select a date range and generate a detailed financial report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DateRangePicker
                value={dateRange}
                onChange={(range: DateRange | undefined) => setDateRange(range)}
              />
              
              {canRenderPDF && (
                <PDFViewer>
                  <FinancialReportPDF
                    dateRange={validDateRange!}
                    totalIncome={summary.totalCredit}
                    incomeChange={(summary.totalCredit - summary.totalDebit) / summary.totalDebit * 100}
                    creditTransactions={credits}
                    incomeData={credits.map(tx => ({
                      name: tx.merchantName,
                      value: tx.amount
                    }))}
                    expenseData={debits.map(tx => ({
                      name: tx.merchantName,
                      value: tx.amount
                    }))}
                  />
                </PDFViewer>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
} 