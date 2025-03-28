"use client"

import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Transaction {
  accountNumber: string
  amount: number
  merchantName: string
  timestamp: number
  transactionMode: string
  upiId?: string
}

interface MonthlyData {
  name: string
  amount: number
  timestamp: number
}

export function DashboardChart() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const debitRef = ref(database, 'debit')

      // Listen for debit transactions
      onValue(debitRef, (snapshot: DataSnapshot) => {
        try {
          const debitData = snapshot.val() as Record<string, Transaction> | null
          
          if (debitData) {
            // Get last 6 months data
            const last6Months = Array.from({ length: 6 }, (_, i) => {
              const date = subMonths(new Date(), i)
              const start = startOfMonth(date).getTime()
              const end = endOfMonth(date).getTime()
              
              // Filter transactions for this month
              const monthTransactions = Object.values(debitData).filter(tx =>
                tx.timestamp >= start && tx.timestamp <= end
              )
              
              // Calculate total amount for the month
              const totalAmount = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0)
              
              return {
                name: format(date, 'MMM yyyy'),
                amount: totalAmount,
                timestamp: start
              }
            }).reverse() // Show oldest to newest

            setMonthlyData(last6Months)
          } else {
            setMonthlyData([])
          }
        } catch (err) {
          console.error('Error processing debit data:', err)
          setError('Error loading monthly data')
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

  if (monthlyData.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No monthly data available
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            Total Expenses: ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={monthlyData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: "#ef4444" }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

