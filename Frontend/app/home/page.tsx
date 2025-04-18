"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BarChart3, Brain, CreditCard, LogOut, PiggyBank, TrendingUp, User, Download } from "lucide-react"
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
                  Smart Financial Management
                </h1>
                <p className="max-w-[600px] text-gray-700 md:text-xl text-lg mt-4">
                  Track expenses, manage budgets, and monitor your crypto portfolio with AI-powered insights
                </p>
                <div className="flex flex-col gap-4 min-[400px]:flex-row pt-6">
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/financebuddy.apk';
                      link.download = 'financebuddy.apk';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    size="lg"
                    className="gap-1.5 hover:scale-105 transition-transform duration-300 pointer-events-auto"
                  >
                    Download Android Application <Download className="h-4 w-4" />
                  </Button>
                  <Link href={user ? "/dashboard" : "/login"}>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="gap-1.5 hover:scale-105 transition-transform duration-300 pointer-events-auto"
                    >
                      View Dashboard <ArrowRight className="h-4 w-4" />
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
                A comprehensive financial management solution powered by AI
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
                  Smart expense tracking with automatic categorization and real-time updates. Monitor your spending patterns effortlessly.
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
                  Create custom budgets with intelligent alerts and insights. Stay on top of your financial goals with dynamic tracking.
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
                  Get personalized financial advice and spending insights powered by advanced AI algorithms. Make smarter financial decisions.
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
                  Track your cryptocurrency investments in real-time. Monitor portfolio performance and get market insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Project Description */}
      <section className="w-full py-12 md:py-24 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter">About FinanceBuddy</h2>
              <p className="text-gray-600">
                FinanceBuddy is a modern financial management platform that combines the power of AI with intuitive design to help you take control of your finances. Built with cutting-edge technologies and focused on user experience, it offers a comprehensive suite of tools for expense tracking, budgeting, and investment management.
              </p>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Technologies Used</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Next.js 13 with App Router</li>
                  <li>Firebase Authentication & Realtime Database</li>
                  <li>TailwindCSS & Shadcn/ui</li>
                  <li>Binance API Integration</li>
                  <li>AI-Powered Financial Analysis</li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter">Key Benefits</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Comprehensive Analytics</h3>
                    <p className="text-gray-600">Detailed financial reports and visualizations to understand your money better.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI-Powered Insights</h3>
                    <p className="text-gray-600">Smart recommendations and predictions to optimize your financial decisions.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Investment Tracking</h3>
                    <p className="text-gray-600">Real-time monitoring of your crypto investments and portfolio performance.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold mb-4">About the Developer</h3>
              <p className="text-gray-600 mb-4">
                Hi, I'm Omkar Gondkar, a passionate full-stack developer with expertise in modern web technologies. 
                I created FinanceBuddy to help people manage their finances more effectively using the power of AI and intuitive design.
              </p>
              <div className="space-y-2">
                <p className="text-gray-600">📧 Email: gondkaromkar53@gmail.com</p>
                <p className="text-gray-600">📱 Contact: +91 8855916700</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Connect With Me</h3>
              <div className="space-y-4">
                <Link 
                  href="https://www.linkedin.com/in/og25/" 
                  target="_blank"
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn Profile
                </Link>
                <Link 
                  href="https://github.com/Omkar2k5" 
                  target="_blank"
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub Repository
                </Link>
                <Link 
                  href="/portfolio" 
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <TrendingUp className="h-5 w-5" />
                  View My Portfolio
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-gray-600">
            <p>© 2024 FinanceBuddy. Built with ❤️ by Omkar Gondkar</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 