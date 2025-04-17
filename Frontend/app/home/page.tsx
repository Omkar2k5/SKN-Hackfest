"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BarChart3, Brain, CreditCard, LogOut, PiggyBank, TrendingUp, User } from "lucide-react"
import Script from "next/script"
import { useEffect, useState } from "react"
import { getCurrentUser, onAuthStateChanged, signOut } from "@/lib/firebase-auth"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Client-side only component for user profile
function UserProfile({ user }: { user: any }) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const { error: signOutError } = await signOut()
      if (signOutError) {
        throw new Error(signOutError)
      }
      localStorage.removeItem("rememberMe")
      router.push("/login")
    } catch (err: any) {
      console.error("Logout error:", err)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || "User"}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.displayName && (
              <p className="font-medium">{user.displayName}</p>
            )}
            {user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuItem
          className="flex items-center gap-2 text-red-600 hover:text-red-600 hover:bg-red-50/10 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isSplineLoaded, setIsSplineLoaded] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((currentUser) => {
      setUser(currentUser)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      <Script 
        type="module" 
        src="https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js"
        onLoad={() => setIsSplineLoaded(true)}
      />
      
      {/* Navigation */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
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
            <span className="text-xl font-bold text-gray-900">FinanceBuddy</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link 
              href="#features" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300"
            >
              Features
            </Link>
            <Link 
              href={user ? "/dashboard" : "/login"}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300"
            >
              Dashboard
            </Link>
            <Link 
              href={user ? "/fingpt" : "/login"}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300"
            >
              FinGPT
            </Link>
            {!user ? (
              <Button 
                onClick={() => router.push('/login')} 
                size="sm"
                className="ml-4 hover:scale-105 transition-transform duration-300"
              >
                Sign In
              </Button>
            ) : (
              <UserProfile user={user} />
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section with Full Screen Spline */}
      <section className="relative w-full h-screen">
        {/* Spline 3D Background */}
        <div className="absolute inset-0 w-full h-full">
          <div className="w-full h-full flex">
            <div className="w-1/2"></div>
            <div className="w-1/2 h-full">
              {isSplineLoaded && (
                <spline-viewer 
                  loading-anim-type="none" 
                  url="https://prod.spline.design/yiSHuuKcb4Eeqohj/scene.splinecode"
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Overlay Content */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="container h-full flex items-center px-4 md:px-6">
            <div className="max-w-2xl space-y-6 animate-fade-in">
              <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none text-gray-900">
                  Smart Budgeting Powered by AI
                </h1>
                <p className="max-w-[600px] text-gray-700 md:text-xl text-lg mt-4">
                  Take control of your finances with our AI-powered budgeting tools. Track expenses, set goals, and get
                  personalized insights.
                </p>
                <div className="flex flex-col gap-4 min-[400px]:flex-row pt-6">
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-1.5 hover:scale-105 transition-transform duration-300 pointer-events-auto">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/portfolio">
                    <Button size="lg" variant="outline" className="gap-1.5 hover:scale-105 transition-transform duration-300 pointer-events-auto">
                      View Portfolio <TrendingUp className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">Key Features</h2>
              <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Everything you need to manage your finances effectively
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-4 lg:gap-12 mt-12">
            <Card className="border-gray-200 bg-white/50 backdrop-blur-sm shadow-lg rounded-2xl hover:scale-105 transition-transform duration-300">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-gray-900">Track Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Easily track and categorize your expenses. Connect your bank accounts for automatic updates.
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white/50 backdrop-blur-sm shadow-lg rounded-2xl hover:scale-105 transition-transform duration-300">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <PiggyBank className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-gray-900">Smart Budgeting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Set personalized budgets and receive alerts when you're approaching your limits.
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white/50 backdrop-blur-sm shadow-lg rounded-2xl hover:scale-105 transition-transform duration-300">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-gray-900">AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Get personalized financial insights and recommendations based on your spending habits.
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white/50 backdrop-blur-sm shadow-lg rounded-2xl hover:scale-105 transition-transform duration-300">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-gray-900">Crypto Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Track your cryptocurrency investments and monitor real-time portfolio performance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Footer - Hackathon Info */}
      <footer className="border-t border-gray-800 bg-[#001a33] text-white py-10 mt-auto">
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
              <p className="text-gray-300 max-w-md mb-4">
                Join a high-energy coding marathon where developers, designers, and innovators come together 
                to build solutions for real-world problems. Push the limits of technology with expert mentorship 
                and a supportive community!
              </p>
              <p className="text-sm text-gray-400">© 2025 Chakravyuh 1.0. All Rights Reserved.</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <div className="bg-[#00e6e6] text-[#001a33] px-6 py-4 rounded-lg inline-flex items-center shadow-md hover:scale-105 transition-transform duration-300">
                <p className="text-lg font-bold">💡 Build | Learn | Impact</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 