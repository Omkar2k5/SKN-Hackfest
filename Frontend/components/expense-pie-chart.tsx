"use client"

import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { isWithinInterval } from "date-fns"

interface Transaction {
  accountNumber: string
  amount: number
  merchantName: string
  timestamp: number
  transactionMode: string
  upiId?: string
}

interface MerchantData {
  name: string
  value: number
  color: string
}

interface ExpensePieChartProps {
  dateRange?: {
    from: Date
    to: Date
  }
}

// Predefined colors for merchants
const COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Orange
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#84cc16"  // Lime
]

export function ExpensePieChart({ dateRange }: ExpensePieChartProps) {
  const [debitTransactions, setDebitTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const debitRef = ref(database, 'debit')

      onValue(debitRef, (snapshot: DataSnapshot) => {
        try {
          const debitData = snapshot.val() as Record<string, Transaction> | null
          
          if (debitData) {
            let transactions = Object.values(debitData)
            
            // Filter by date range if provided
            if (dateRange) {
              transactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.timestamp)
                return isWithinInterval(transactionDate, {
                  start: dateRange.from,
                  end: dateRange.to
                })
              })
            }
            
            setDebitTransactions(transactions)
          } else {
            setDebitTransactions([])
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

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    )
  }

  if (debitTransactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No expense data available
      </div>
    )
  }

  // Group transactions by merchant and calculate totals
  const merchantTotals = debitTransactions.reduce((acc, transaction) => {
    const merchantName = transaction.merchantName
    if (!acc[merchantName]) {
      acc[merchantName] = {
        name: merchantName,
        value: 0,
        color: COLORS[Object.keys(acc).length % COLORS.length]
      }
    }
    acc[merchantName].value += transaction.amount
    return acc
  }, {} as Record<string, MerchantData>)

  // Convert to array and sort by value
  const data = Object.values(merchantTotals)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Show top 10 merchants

  const totalAmount = data.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-2 border rounded-lg shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">₹{data.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground">
            {((data.value / totalAmount) * 100).toFixed(1)}% of total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

