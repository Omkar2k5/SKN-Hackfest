"use client"

import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { CreditCard } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface Transaction {
  accountNumber: string
  amount: number
  merchantName: string
  timestamp: number
  transactionMode: string
  upiId?: string
}

interface MerchantTotal {
  merchantName: string
  totalAmount: number
  transactionCount: number
}

export function BudgetStatus() {
  const [merchantTotals, setMerchantTotals] = useState<MerchantTotal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [maxAmount, setMaxAmount] = useState(0)

  useEffect(() => {
    try {
      const debitRef = ref(database, 'debit')

      onValue(debitRef, (snapshot: DataSnapshot) => {
        try {
          const debitData = snapshot.val() as Record<string, Transaction> | null
          
          if (debitData) {
            // Group transactions by merchant name and calculate totals
            const merchantSums = Object.values(debitData).reduce((acc, transaction) => {
              const existing = acc.find(m => m.merchantName === transaction.merchantName)
              
              if (existing) {
                existing.totalAmount += transaction.amount
                existing.transactionCount += 1
              } else {
                acc.push({
                  merchantName: transaction.merchantName,
                  totalAmount: transaction.amount,
                  transactionCount: 1
                })
              }
              
              return acc
            }, [] as MerchantTotal[])

            // Sort by total amount (highest first)
            const sortedMerchants = merchantSums.sort((a, b) => b.totalAmount - a.totalAmount)
            
            // Find the highest amount for progress bar calculation
            const highestAmount = Math.max(...sortedMerchants.map(m => m.totalAmount))
            setMaxAmount(highestAmount)
            
            // Take top 5 merchants by spend
            setMerchantTotals(sortedMerchants.slice(0, 5))
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
  }, [])

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {merchantTotals.length === 0 ? (
        <div className="text-center text-muted-foreground p-4">
          No expense data available
        </div>
      ) : (
        merchantTotals.map((merchant) => (
          <div key={merchant.merchantName} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{merchant.merchantName}</span>
              </div>
              <span className="text-sm">
                ₹{merchant.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Progress 
              value={(merchant.totalAmount / maxAmount) * 100} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground">
              {merchant.transactionCount} transaction{merchant.transactionCount !== 1 ? 's' : ''} •
              {((merchant.totalAmount / maxAmount) * 100).toFixed(1)}% of highest spend
            </p>
          </div>
        ))
      )}
    </div>
  )
} 