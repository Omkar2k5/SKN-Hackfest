"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { IndianRupee, ArrowUpDown, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNav } from "@/components/dashboard-nav"
import { useFinance } from "@/hooks/useFinance"
import { Transaction } from "@/types/finance"

export default function TransactionsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const {
    loading: dataLoading,
    error: dataError,
    credits,
    debits,
    refresh
  } = useFinance()

  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Handle authentication state
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

  // Combine and sort transactions when data changes
  useEffect(() => {
    if (credits && debits) {
      const allTransactions: Transaction[] = [
        ...credits.map(tx => ({ ...tx, type: 'credit' as const })),
        ...debits.map(tx => ({ ...tx, type: 'debit' as const }))
      ].sort((a, b) => b.timestamp - a.timestamp)

      setTransactions(allTransactions)
    }
  }, [credits, debits])

  // Handle refresh
  const handleRefresh = () => {
    if (!user) return
    refresh()
  }

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
              <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
              <p className="text-muted-foreground">View and manage your financial transactions</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Your complete transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No transactions found
                  </div>
                ) : (
                  transactions.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{transaction.merchantName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.timestamp).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.transactionMode} • {transaction.accountNumber}
                        </p>
                      </div>
                      <div className={`text-sm font-medium ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹
                        {transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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