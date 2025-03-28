"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ref, onValue, DataSnapshot } from "firebase/database"
import { database } from "@/lib/firebase"
import { AlertCircle, ArrowRight, Brain, DollarSign, HelpCircle, Plus, Settings } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetForm } from "@/components/budget-form"
import { DashboardNav } from "@/components/dashboard-nav"

interface Budget {
  category: string
  amount: number
  description: string
  spent: number
  createdAt: number
  isActive: boolean
}

export default function BudgetingPage() {
  const [budgets, setBudgets] = useState<Record<string, Budget>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const budgetsRef = ref(database, 'budgets')

      onValue(budgetsRef, (snapshot: DataSnapshot) => {
        try {
          const data = snapshot.val() as Record<string, Budget> | null
          if (data) {
            setBudgets(data)
          } else {
            setBudgets({})
          }
        } catch (err) {
          console.error('Error processing budgets:', err)
          setError('Error loading budgets')
        }
      })
    } catch (err) {
      console.error('Error setting up Firebase listener:', err)
      setError('Error connecting to database')
    }
  }, [])

  const activeBudgets = Object.entries(budgets)
    .filter(([_, budget]) => budget.isActive)
    .sort((a, b) => b[1].createdAt - a[1].createdAt)

  const getBudgetColor = (percentage: number) => {
    if (percentage >= 90) return 'border-l-rose-500'
    if (percentage >= 70) return 'border-l-amber-500'
    return 'border-l-green-500'
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FinanceBuddy</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Help</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <img
                src="/placeholder.svg?height=32&width=32"
                width={32}
                height={32}
                alt="Avatar"
                className="rounded-full"
              />
              <span>John Doe</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="grid flex-1 md:grid-cols-[240px_1fr]">
        <DashboardNav className="hidden border-r md:block" />
        <main className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Smart Budgeting</h1>
              <p className="text-muted-foreground">Set spending limits and get AI-powered savings tips</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Budget Settings
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Budget
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">Active Budgets</TabsTrigger>
              <TabsTrigger value="create">Create Budget</TabsTrigger>
              <TabsTrigger value="history">Budget History</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeBudgets.length === 0 ? (
                  <Card className="col-span-full">
                    <CardHeader>
                      <CardTitle>No Active Budgets</CardTitle>
                      <CardDescription>Create a new budget to get started</CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  activeBudgets.map(([id, budget]) => {
                    const percentage = (budget.spent / budget.amount) * 100;
                    return (
                      <Card key={id} className={`border-l-4 ${getBudgetColor(percentage)}`}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{budget.category}</span>
                            <span className="text-sm font-normal">
                              ₹{budget.spent.toLocaleString('en-IN')}/₹{budget.amount.toLocaleString('en-IN')}
                            </span>
                          </CardTitle>
                          <CardDescription>{budget.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Progress value={percentage} className="h-2" />
                          <p className="mt-2 text-xs text-muted-foreground">
                            {percentage.toFixed(1)}% of budget used
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Savings Tips</CardTitle>
                  <CardDescription>Personalized recommendations based on your spending habits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <Brain className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Budget Utilization</h4>
                      <p className="text-sm text-muted-foreground">
                        Track your spending against your budget limits to stay within your financial goals.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <Brain className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Spending Patterns</h4>
                      <p className="text-sm text-muted-foreground">
                        Monitor your spending patterns and adjust your budgets accordingly.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    Get More Personalized Tips
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle>Create a New Budget</CardTitle>
                  <CardDescription>Set up spending limits for different categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <BudgetForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

