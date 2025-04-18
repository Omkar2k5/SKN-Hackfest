"use client"

import { Transaction } from "@/types/finance"
import { Progress } from "@/components/ui/progress"

interface ExpenseCategoriesProps {
  transactions: Transaction[]
}

interface CategoryTotal {
  category: string
  amount: number
  percentage: number
}

export function ExpenseCategories({ transactions }: ExpenseCategoriesProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No expense data available
      </div>
    )
  }

  // Calculate totals by merchant (using merchant as category for now)
  const categoryTotals = transactions.reduce((acc: Record<string, number>, tx) => {
    const category = tx.merchantName // Using merchant name as category
    acc[category] = (acc[category] || 0) + tx.amount
    return acc
  }, {})

  const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)

  // Convert to array and calculate percentages
  const categories: CategoryTotal[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalSpent) * 100
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5) // Show top 5 categories

  return (
    <div className="space-y-4">
      {categories.map((category, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{category.category}</span>
            <span className="text-muted-foreground">
              ₹{category.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <Progress value={category.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {category.percentage.toFixed(1)}%
          </p>
        </div>
      ))}
    </div>
  )
}

