"use client"

import { useState } from "react"
import { ref, push } from "firebase/database"
import { database } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export function BudgetForm() {
  const { toast } = useToast()
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [merchants, setMerchants] = useState("")
  const [upiIds, setUpiIds] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!database) {
      toast({
        title: "Error",
        description: "Database not initialized. Please try again later.",
        variant: "destructive"
      })
      setIsSubmitting(false)
      return
    }

    try {
      const budgetsRef = ref(database, 'budgets')
      await push(budgetsRef, {
        category,
        amount: Number(amount),
        description,
        merchants: merchants.split(',').map(m => m.trim()),
        upiIds: upiIds.split(',').map(upi => upi.trim()),
        spent: 0,
        createdAt: Date.now(),
        isActive: true,
        budgetReached: false
      })

      toast({
        title: "Budget Created",
        description: "Your new budget has been created successfully.",
      })

      // Reset form
      setCategory("")
      setAmount("")
      setDescription("")
      setMerchants("")
      setUpiIds("")
    } catch (error) {
      console.error("Error creating budget:", error)
      toast({
        title: "Error",
        description: "Failed to create budget. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="merchants">Phone Numbers (comma-separated)</Label>
        <Input
          id="merchants"
          value={merchants}
          onChange={(e) => setMerchants(e.target.value)}
          placeholder="e.g. 9371110123"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="upiIds">UPI IDs (comma-separated)</Label>
        <Input
          id="upiIds"
          value={upiIds}
          onChange={(e) => setUpiIds(e.target.value)}
          placeholder="e.g. 9371110123@superyes"
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Budget"}
      </Button>
    </form>
  )
}

