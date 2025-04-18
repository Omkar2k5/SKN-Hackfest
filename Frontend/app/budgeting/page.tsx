"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, Brain, DollarSign, HelpCircle, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetForm } from "@/components/budget-form"
import { DashboardNav } from "@/components/dashboard-nav"
import { useFinance } from "@/hooks/useFinance"
import { Budget } from "@/types/finance"

export default function BudgetingPage() {
  const router = useRouter()
  const auth = getAuth()
  const [user, setUser] = useState(auth.currentUser)
  const {
    loading: dataLoading,
    error: dataError,
    budgets,
    refresh
  } = useFinance()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Handle authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [auth, router])

  // Handle refresh
  const handleRefresh = () => {
    if (!user) return
    refresh()
  }

  // Filter active and history budgets
  const activeBudgets = budgets?.filter(budget => budget.isActive)
    .sort((a, b) => b.createdAt - a.createdAt) || []

  const historyBudgets = budgets?.filter(budget => !budget.isActive)
    .sort((a, b) => b.createdAt - a.createdAt) || []

  const getBudgetColor = (budget: Budget) => {
    if (budget.budgetReached) return 'border-l-rose-500'
    const percentage = (budget.spent / budget.amount) * 100
    if (percentage >= 90) return 'border-l-amber-500'
    return 'border-l-green-500'
  }

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || dataError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || dataError}</p>
          <Button onClick={handleRefresh} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Link href="/home" className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FinanceBuddy</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Refresh</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  width={32}
                  height={32}
                  alt="Avatar"
                  className="rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
              )}
              <span>{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
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
                  activeBudgets.map((budget) => {
                    const percentage = (budget.spent / budget.amount) * 100;
                    return (
                      <Card key={budget.id} className={`border-l-4 ${getBudgetColor(budget)}`}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{budget.category}</span>
                            <span className="text-sm font-normal">
                              ₹{budget.spent.toLocaleString('en-IN')}/₹{budget.amount.toLocaleString('en-IN')}
                            </span>
                          </CardTitle>
                          <CardDescription>
                            {budget.description}
                            {budget.budgetReached && (
                              <p className="mt-1 text-rose-500 font-medium">Budget limit exceeded!</p>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Progress 
                            value={percentage} 
                            className={`h-2 ${budget.budgetReached ? 'bg-rose-100' : ''}`} 
                          />
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

            <TabsContent value="history" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {historyBudgets.length === 0 ? (
                  <Card className="col-span-full">
                    <CardHeader>
                      <CardTitle>No Budget History</CardTitle>
                      <CardDescription>Completed budgets will appear here</CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  historyBudgets.map((budget) => {
                    const percentage = (budget.spent / budget.amount) * 100;
                    return (
                      <Card key={budget.id} className="border-l-4 border-l-gray-400">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{budget.category}</span>
                            <span className="text-sm font-normal">
                              ₹{budget.spent.toLocaleString('en-IN')}/₹{budget.amount.toLocaleString('en-IN')}
                            </span>
                          </CardTitle>
                          <CardDescription>
                            {budget.description}
                            <p className="mt-1 text-gray-500">Completed on: {new Date(budget.createdAt).toLocaleDateString()}</p>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Progress 
                            value={percentage} 
                            className="h-2 bg-gray-100" 
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            Final usage: {percentage.toFixed(1)}%
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
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
  )
}

