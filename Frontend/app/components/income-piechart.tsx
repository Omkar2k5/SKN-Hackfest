"use client"

import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { isWithinInterval, startOfDay, endOfDay } from "date-fns"

interface Transaction {
  accountNumber: string
  amount: number
  merchantName: string
  timestamp: number
  transactionMode: string
  upiId?: string
}

interface CategoryData {
  name: string
  value: number
  color: string
  sampleValue: number
}

// Predefined income categories with their colors and keywords
const INCOME_CATEGORIES = {
  salary: {
    name: "Salary",
    color: "#10b981", // Green
    keywords: ["salary", "payroll", "wage", "stipend"],
    sampleValue: 50000
  },
  investments: {
    name: "Investments",
    color: "#3b82f6", // Blue
    keywords: ["dividend", "interest", "stock", "mutual fund", "fd", "fixed deposit"],
    sampleValue: 10000
  },
  freelance: {
    name: "Freelance",
    color: "#f59e0b", // Orange
    keywords: ["freelance", "consulting", "project", "contract"],
    sampleValue: 20000
  },
  rental: {
    name: "Rental Income",
    color: "#8b5cf6", // Purple
    keywords: ["rent", "lease", "property"],
    sampleValue: 15000
  },
  other: {
    name: "Other Income",
    color: "#6b7280", // Gray
    keywords: [],
    sampleValue: 5000
  }
}

interface IncomePieChartProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

const CustomTooltip = ({ active, payload, totalAmount }: any) => {
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

export function IncomePieChart({ dateRange }: IncomePieChartProps) {
  const [creditTransactions, setCreditTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const creditRef = ref(database, 'credit')

      onValue(creditRef, (snapshot: DataSnapshot) => {
        try {
          const creditData = snapshot.val() as Record<string, Transaction> | null
          
          if (creditData) {
            const transactions = Object.values(creditData)
              .filter(transaction => {
                const transactionDate = new Date(transaction.timestamp)
                return isWithinInterval(transactionDate, {
                  start: startOfDay(dateRange.from),
                  end: endOfDay(dateRange.to)
                })
              })
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

  // Initialize data with all categories
  const initialData = Object.entries(INCOME_CATEGORIES).map(([key, category]) => ({
    name: category.name,
    value: category.sampleValue,
    color: category.color,
    sampleValue: category.sampleValue
  })) as CategoryData[]

  if (creditTransactions.length === 0) {
    const totalAmount = initialData.reduce((sum, item) => sum + item.value, 0)
    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={initialData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {initialData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={(props) => <CustomTooltip {...props} totalAmount={totalAmount} />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center text-muted-foreground mt-2">
          Sample income distribution
        </div>
      </div>
    )
  }

  // Categorize transactions based on merchant name
  const categorizedTotals = creditTransactions.reduce((acc, transaction) => {
    const merchantName = transaction.merchantName.toLowerCase()
    let category = "other"

    // Check if the merchant name matches any category keywords
    for (const [key, categoryInfo] of Object.entries(INCOME_CATEGORIES)) {
      if (categoryInfo.keywords.some(keyword => merchantName.includes(keyword))) {
        category = key
        break
      }
    }

    if (!acc[category]) {
      acc[category] = {
        name: INCOME_CATEGORIES[category as keyof typeof INCOME_CATEGORIES].name,
        value: 0,
        color: INCOME_CATEGORIES[category as keyof typeof INCOME_CATEGORIES].color
      }
    }
    acc[category].value += transaction.amount
    return acc
  }, {} as Record<string, { name: string; value: number; color: string }>)

  // Merge transaction data with initial categories to ensure all categories are shown
  const data = initialData.map(category => ({
    ...category,
    value: categorizedTotals[Object.keys(INCOME_CATEGORIES).find(key => 
      INCOME_CATEGORIES[key as keyof typeof INCOME_CATEGORIES].name === category.name
    ) || 'other']?.value || category.sampleValue
  }))

  const totalAmount = data.reduce((sum, item) => sum + item.value, 0)

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
          <Tooltip content={(props) => <CustomTooltip {...props} totalAmount={totalAmount} />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 