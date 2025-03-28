"use client"

import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { ArrowDown, ArrowUp } from "lucide-react"
import { format } from "date-fns"

interface Transaction {
  accountNumber: string
  amount: number
  merchantName: string
  timestamp: number
  transactionMode: string
  upiId?: string
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<(Transaction & { type: 'credit' | 'debit' })[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const creditRef = ref(database, 'credit')
      const debitRef = ref(database, 'debit')

      // Listen for credit transactions
      onValue(creditRef, (snapshot: DataSnapshot) => {
        try {
          const creditData = snapshot.val() as Record<string, Transaction> | null
          if (creditData) {
            const creditTransactions = Object.values(creditData).map(tx => ({
              ...tx,
              type: 'credit' as const
            }))
            updateTransactions(creditTransactions, 'credit')
          }
        } catch (err) {
          console.error('Error processing credit transactions:', err)
          setError('Error loading credit transactions')
        }
      })

      // Listen for debit transactions
      onValue(debitRef, (snapshot: DataSnapshot) => {
        try {
          const debitData = snapshot.val() as Record<string, Transaction> | null
          if (debitData) {
            const debitTransactions = Object.values(debitData).map(tx => ({
              ...tx,
              type: 'debit' as const
            }))
            updateTransactions(debitTransactions, 'debit')
          }
        } catch (err) {
          console.error('Error processing debit transactions:', err)
          setError('Error loading debit transactions')
        }
      })
    } catch (err) {
      console.error('Error setting up Firebase listeners:', err)
      setError('Error connecting to database')
    }
  }, [])

  const updateTransactions = (newTransactions: (Transaction & { type: 'credit' | 'debit' })[], type: 'credit' | 'debit') => {
    setTransactions(prevTransactions => {
      // Filter out old transactions of the same type
      const filteredTransactions = prevTransactions.filter(tx => tx.type !== type)
      // Add new transactions
      const updatedTransactions = [...filteredTransactions, ...newTransactions]
      // Sort by timestamp (most recent first) and limit to 10 transactions
      return updatedTransactions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
    })
  }

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
          No recent transactions
        </div>
      ) : (
        transactions.map((transaction, index) => (
          <div
            key={`${transaction.timestamp}-${index}`}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${
                transaction.type === 'credit' 
                  ? 'bg-emerald-100 text-emerald-500'
                  : 'bg-rose-100 text-rose-500'
              }`}>
                {transaction.type === 'credit' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
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
            <div className={`text-right ${
              transaction.type === 'credit' 
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}>
              <p className="font-medium">
                {transaction.type === 'credit' ? '+' : '-'}₹
                {transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

