"use client"

import { Transaction } from "@/types/finance"

interface ExpenseListProps {
  transactions: Transaction[]
}

export function ExpenseList({ transactions }: ExpenseListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No expenses found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{transaction.merchantName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(transaction.timestamp).toLocaleDateString()}
            </p>
          </div>
          <div className="text-sm font-medium text-red-600">
            -₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      ))}
    </div>
  )
}

