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

// Predefined colors for merchants
const COLORS = [
  "#10B981", // Green
  "#3B82F6", // Blue
  "#F59E0B", // Orange
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#14B8A6", // Teal
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1"  // Indigo
]

interface IncomePieChartProps {
  dateRange?: {
    from: Date
    to: Date
  }
}

export function IncomePieChart({ dateRange }: IncomePieChartProps) {
  const [creditTransactions, setCreditTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!database) {
      console.error('Firebase database not initialized')
      setError('Database connection error')
      return
    }

    try {
      const creditRef = ref(database, 'credit')

      onValue(creditRef, (snapshot: DataSnapshot) => {
        try {
          const creditData = snapshot.val() as Record<string, Transaction> | null
          
          if (creditData) {
            let transactions = Object.values(creditData)
            
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
            
            setCreditTransactions(transactions)
          } else {
            setCreditTransactions([])
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
  }, [dateRange])

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    )
  }

  if (creditTransactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No income data available for the selected period
      </div>
    )
  }

  // Group transactions by merchant and calculate totals
  const merchantTotals = creditTransactions.reduce((acc, transaction) => {
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
    .slice(0, 10) // Show top 10 income sources

  const totalIncome = data.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-2 border rounded-lg shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">₹{data.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground">
            {((data.value / totalIncome) * 100).toFixed(1)}% of total income
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