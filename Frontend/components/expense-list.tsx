"use client"

import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { ArrowDown } from "lucide-react"
import { format } from "date-fns"

interface Transaction {
  accountNumber: string
  amount: number
  merchantName: string
  timestamp: number
  transactionMode: string
  upiId?: string
}

export function ExpenseList({ type }: { type?: 'income' | 'expense' | undefined }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const debitRef = ref(database, 'debit')

      // Listen for debit transactions
      onValue(debitRef, (snapshot: DataSnapshot) => {
        try {
          const debitData = snapshot.val() as Record<string, Transaction> | null
          if (debitData) {
            const debitTransactions = Object.values(debitData)
              .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp (most recent first)
              .slice(0, 10) // Limit to 10 transactions
            setTransactions(debitTransactions)
          } else {
            setTransactions([])
          }
        } catch (err) {
          console.error('Error processing debit transactions:', err)
          setError('Error loading transactions')
        }
      })
    } catch (err) {
      console.error('Error setting up Firebase listener:', err)
      setError('Error connecting to database')
    }
  }, [])

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.length === 0 ? (
        <div className="text-center text-muted-foreground p-4">
          No transactions found
        </div>
      ) : (
        transactions.map((transaction, index) => (
          <div
            key={`${transaction.timestamp}-${index}`}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-rose-100 text-rose-500">
                <ArrowDown className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{transaction.merchantName}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.transactionMode} {transaction.upiId ? `• ${transaction.upiId}` : ''}
                </p>
              </div>
            </div>
            <div className="text-right text-rose-600">
              <p className="font-medium">
                -₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">
                {transaction.accountNumber}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

