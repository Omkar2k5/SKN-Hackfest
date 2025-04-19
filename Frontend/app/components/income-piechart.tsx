"use client"

import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface ChartData {
  name: string
  value: number
}

interface Transaction {
  merchantName: string
  amount: number
}

interface IncomePiechartProps {
  data?: ChartData[]
}

export function IncomePiechart({ data = [] }: IncomePiechartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    if (!database) {
      console.error('Firebase database not initialized')
      return
    }

    try {
      const creditRef = ref(database, 'credit')

      const unsubscribe = onValue(creditRef, (snapshot: DataSnapshot) => {
        try {
          if (!snapshot.exists()) {
            setChartData([])
            return
          }

          const creditData = snapshot.val() as Record<string, Transaction>
          // Process data for pie chart
          const processedData = Object.values(creditData).reduce((acc: ChartData[], curr: Transaction) => {
            const source = curr.merchantName || 'Unknown'
            const amount = curr.amount || 0
            const existingSource = acc.find((item) => item.name === source)
            
            if (existingSource) {
              existingSource.value += amount
            } else {
              acc.push({ name: source, value: amount })
            }
            return acc
          }, [])

          setChartData(processedData)
        } catch (error) {
          console.error('Error processing credit data:', error)
          setChartData([])
        }
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error setting up database listener:', error)
    }
  }, [])

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">No income data available</p>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={[
                  '#0088FE',
                  '#00C49F',
                  '#FFBB28',
                  '#FF8042',
                  '#8884d8',
                ][index % 5]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              'Amount'
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 