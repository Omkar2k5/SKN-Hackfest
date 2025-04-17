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

interface Budget {
  id?: string
  amount: number
  budgetReached: boolean
  category: string
  createdAt: number
  description: string
  isActive: boolean
  merchants: string[]
  spent: number
  upiIds?: string[]
}

interface BudgetStatusProps {
  budgets: Budget[]
}

export function BudgetStatus({ budgets }: BudgetStatusProps) {
  const activeBudgets = budgets.filter(budget => budget.isActive)

  return (
    <div className="space-y-4">
      {activeBudgets.map((budget) => (
        <div key={budget.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">{budget.category}</div>
              <div className="text-xs text-muted-foreground">{budget.description}</div>
            </div>
            <div className="text-sm font-medium">
              ₹{budget.spent.toLocaleString('en-IN')} / ₹{budget.amount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary">
            <div
              className={`h-2 rounded-full ${
                budget.budgetReached ? 'bg-red-500' : 'bg-primary'
              }`}
              style={{
                width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
      {activeBudgets.length === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          No active budgets
        </div>
      )}
    </div>
  )
} 