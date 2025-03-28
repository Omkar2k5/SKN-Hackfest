"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BarChart3, Brain, CreditCard, PiggyBank, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { getCurrentUser, onAuthStateChanged } from "@/lib/firebase-auth"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((currentUser) => {
      setUser(currentUser)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Only redirect to login for protected actions
  const handleProtectedAction = () => {
    if (!user) {
      router.push('/login')
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Image 
              src="/images/finance-logo.png" 
              alt="FinanceBuddy Logo" 
              width={40} 
              height={40} 
              className="object-contain"
              priority
            />
            <span className="text-xl font-bold">FinanceBuddy</span>
          </div>
          <nav className="flex items-center gap-8">
            <Link 
              href="#features" 
              className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
            >
              Features
            </Link>
            <Link 
              href={user ? "/dashboard" : "/login"}
              className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href={user ? "/fingpt" : "/login"}
              className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
            >
              FinGPT
            </Link>
            {!user && (
              <Button 
                onClick={() => router.push('/login')} 
                size="sm"
                className="ml-4"
              >
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-blue-50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Smart Budgeting Powered by AI
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl">
                  Take control of your finances with our AI-powered budgeting tools. Track expenses, set goals, and get
                  personalized insights.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/dashboard">
                  <Button size="lg" className="gap-1.5">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button size="lg" variant="outline" className="gap-1.5">
                    View Portfolio <TrendingUp className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto lg:mx-0 relative">
              <div className="relative rounded-lg border bg-background p-2 shadow-lg">
                <div className="rounded-md bg-white shadow-sm">
                  <Image
                    src="/images/homelogo.png"
                    alt="Dashboard Preview"
                    width={700}
                    height={500}
                    className="rounded-md object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Everything you need to manage your finances effectively
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-4 lg:gap-12 mt-12">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Track Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Easily track and categorize your expenses. Connect your bank accounts for automatic updates.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <PiggyBank className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Budgeting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Set personalized budgets and receive alerts when you're approaching your limits.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Get personalized financial insights and recommendations based on your spending habits.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Crypto Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Track your cryptocurrency investments and monitor real-time portfolio performance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Footer - Hackathon Info */}
      <footer className="border-t bg-[#001a33] text-white py-10 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="w-fit mb-6">
                <Image 
                  src="/images/Sveri.jpg" 
                  alt="SVERI Logo" 
                  width={180} 
                  height={180} 
                  className="object-contain rounded-full border-4 border-[#00e6e6] shadow-lg"
                  priority
                />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#9eff3d]">Chakravyuh 1.0 – 24-Hour Hackathon</h3>
              <p className="text-lg font-semibold text-[#00e6e6] mb-1">Innovate. Collaborate. Create.</p>
              <p className="text-gray-200 max-w-md mb-4">
                Join a high-energy coding marathon where developers, designers, and innovators come together 
                to build solutions for real-world problems. Push the limits of technology with expert mentorship 
                and a supportive community!
              </p>
              <p className="text-sm text-gray-300">© 2025 Chakravyuh 1.0. All Rights Reserved.</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <div className="bg-[#00e6e6] text-[#001a33] px-6 py-4 rounded-lg inline-flex items-center shadow-md">
                <p className="text-lg font-bold">💡 Build | Learn | Impact</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 