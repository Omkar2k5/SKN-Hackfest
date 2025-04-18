"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { IndianRupee, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react"
import Image from "next/image"
import { getDatabase, ref, get } from "firebase/database"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNav } from "@/components/dashboard-nav"
import { BinanceCredentialsForm } from "@/components/binance-credentials-form"

interface CryptoAsset {
  symbol: string
  amount: number
  price: number
  value: number
  change24h: number
  available_amount: number
  locked_amount: number
}

export default function PortfolioPage() {
  const router = useRouter()
  const auth = getAuth()
  const [user, setUser] = useState(auth.currentUser)
  const [portfolio, setPortfolio] = useState<CryptoAsset[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [hasCredentials, setHasCredentials] = useState<boolean>(false)

  // Check if user has Binance credentials
  const checkCredentials = async (uid: string) => {
    try {
      const db = getDatabase()
      const credentialsSnapshot = await get(ref(db, `users/${uid}/binance_credentials`))
      setHasCredentials(credentialsSnapshot.exists())
      return credentialsSnapshot.exists()
    } catch (err) {
      console.error('Error checking credentials:', err)
      return false
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
      const hasApiKeys = await checkCredentials(currentUser.uid)
      if (hasApiKeys) {
        fetchPortfolio()
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [auth, router])

  useEffect(() => {
    const updateTimeString = () => {
      setLastUpdated(new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    updateTimeString()
    const interval = setInterval(updateTimeString, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/portfolio', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': user?.uid || '', // Add user UID to headers
        },
        cache: 'no-store'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          // Credentials not found, show form
          setHasCredentials(false)
          return
        }
        throw new Error(data.error || 'Failed to fetch portfolio data')
      }

      if (!data.balanceData || !data.marketData) {
        throw new Error('Invalid data received from server')
      }

      // Process and combine the data
      const assets: CryptoAsset[] = data.balanceData
        .filter((balance: any) => parseFloat(balance.balance) > 0)
        .map((balance: any) => {
          // Find market data for this asset
          const market = data.marketData.find((m: any) => 
            m.symbol === `${balance.currency}USDT` || 
            m.symbol === `${balance.currency}BUSD`
          )

          // Use USDT price directly (assuming prices are in USDT)
          const price = market ? parseFloat(market.last_price) : 0
          const amount = parseFloat(balance.balance)
          const value = amount * price

          return {
            symbol: balance.currency,
            amount: amount,
            price: price,
            value: value,
            change24h: market?.change_24_hour || 0,
            available_amount: parseFloat(balance.available_balance),
            locked_amount: parseFloat(balance.locked_balance)
          }
        })
        .sort((a: CryptoAsset, b: CryptoAsset) => b.value - a.value)

      setPortfolio(assets)
      setTotalValue(assets.reduce((sum, asset) => sum + asset.value, 0))
      setError(null)
      setHasCredentials(true)
    } catch (err) {
      console.error('Error fetching portfolio:', err)
      setError(err instanceof Error ? err.message : 'Failed to load portfolio data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialsSaved = () => {
    setHasCredentials(true)
    fetchPortfolio()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasCredentials) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <Link href="/" className="flex items-center gap-2">
              <IndianRupee className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">FinanceBuddy</span>
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2">
                {user?.photoURL ? (
                  <Image
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
          <main className="flex flex-col items-center justify-center p-6">
            <div className="flex flex-col items-center text-center max-w-lg w-full gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Crypto Portfolio Setup</h1>
                <p className="text-muted-foreground">
                  Enter your Binance API credentials to get started
                </p>
              </div>
              <div className="w-full">
                <BinanceCredentialsForm onSuccess={handleCredentialsSaved} />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FinanceBuddy</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2">
              <Image
                src="/placeholder.svg"
                width={32}
                height={32}
                alt="Avatar"
                className="rounded-full"
              />
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
              <h1 className="text-2xl font-bold tracking-tight">Crypto Portfolio</h1>
              <p className="text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            </div>
            <Button onClick={fetchPortfolio} disabled={isLoading} size="sm">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {error ? (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Overview</CardTitle>
                  <CardDescription>Total value of your crypto assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                  <Card className="col-span-full">
                    <CardHeader>
                      <CardTitle>Loading portfolio...</CardTitle>
                    </CardHeader>
                  </Card>
                ) : portfolio.length === 0 ? (
                  <Card className="col-span-full">
                    <CardHeader>
                      <CardTitle>No assets found</CardTitle>
                      <CardDescription>Your portfolio is empty</CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  portfolio.map((asset) => (
                    <Card key={asset.symbol}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{asset.symbol}</span>
                          <span className={`text-sm ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {asset.change24h >= 0 ? (
                              <ArrowUpRight className="h-4 w-4 inline" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 inline" />
                            )}
                            {Math.abs(asset.change24h)}%
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Available</span>
                            <span>{asset.available_amount.toFixed(8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Locked</span>
                            <span>{asset.locked_amount.toFixed(8)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price</span>
                            <span>₹{asset.price.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Total Value</span>
                            <span>₹{asset.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
} 