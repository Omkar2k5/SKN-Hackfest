"use client"

import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function ExpensePieChart() {
  const [merchantTotals, setMerchantTotals] = useState<MerchantTotal[]>([])
  const [error, setError] = useState<string | null>(null)

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

            // Sort by total amount (highest first) and take top 5
            const sortedMerchants = merchantSums
              .sort((a, b) => b.totalAmount - a.totalAmount)
              .slice(0, 5)
            
            setMerchantTotals(sortedMerchants)
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

  if (merchantTotals.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No expense data available
      </div>
    )
  }

  const data = merchantTotals.map((merchant, index) => ({
    name: merchant.merchantName,
    value: merchant.totalAmount,
    color: COLORS[index % COLORS.length]
  }))

  const totalAmount = merchantTotals.reduce((sum, merchant) => sum + merchant.totalAmount, 0)

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
            paddingAngle={5}
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

