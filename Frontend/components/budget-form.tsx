"use client"

import { useState } from "react"
import { ref, push } from "firebase/database"
import { database } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export function BudgetForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    description: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const budgetRef = ref(database, 'budgets')
      await push(budgetRef, {
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        spent: 0,
        createdAt: Date.now(),
        isActive: true
      })

      toast({
        title: "Budget Created",
        description: "Your new budget has been created successfully.",
      })

      // Reset form
      setFormData({
        category: "",
        amount: "",
        description: ""
      })
    } catch (error) {
      console.error('Error creating budget:', error)
      toast({
        title: "Error",
        description: "Failed to create budget. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="category">Category Name</Label>
        <Input
          id="category"
          name="category"
          placeholder="e.g., Dining, Shopping, Entertainment"
          value={formData.category}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="amount">Monthly Budget Amount (₹)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          placeholder="Enter amount"
          value={formData.amount}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Brief description of this budget category"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Budget"}
      </Button>
    </form>
  )
}

