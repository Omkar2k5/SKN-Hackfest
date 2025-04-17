"use client"

import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { ArrowDown, ArrowUp } from "lucide-react"
import { format } from "date-fns"
import { Transaction } from "@/types/finance"

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No recent transactions
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
          <div className={`text-sm font-medium ${
            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.type === 'credit' ? '+' : '-'}₹
            {transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      ))}
    </div>
  )
}

