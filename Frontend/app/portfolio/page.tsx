"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { IndianRupee, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react"
import crypto from 'crypto'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardNav } from "@/components/dashboard-nav"

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
  const [portfolio, setPortfolio] = useState<CryptoAsset[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const API_KEY = "0115b23fb95bda0834b6f7435cf470be1bf9829549666528"
  const API_SECRET = "d2cc46961dadcb55d0b83a1163b977a9a737ab7b0c676237f508d8a0ed2714a2"

  const generateSignature = (body: string, timestamp: number) => {
    const payload = body + timestamp
    return crypto
      .createHmac('sha256', API_SECRET)
      .update(payload)
      .digest('hex')
  }

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true)
      const timestamp = Date.now()
      const body = "" // Empty string for GET requests
      const signature = generateSignature(body, timestamp)

      // Fetch balances
      const balanceResponse = await fetch('https://api.coindcx.com/exchange/v1/users/balances', {
        method: 'GET',
        headers: {
          'X-AUTH-APIKEY': API_KEY,
          'X-AUTH-SIGNATURE': signature,
          'X-AUTH-TIMESTAMP': timestamp.toString(),
        },
      })

      if (!balanceResponse.ok) {
        throw new Error('Failed to fetch portfolio data')
      }

      const balanceData = await balanceResponse.json()

      // Fetch market prices
      const priceResponse = await fetch('https://api.coindcx.com/exchange/v1/markets_details')
      const marketData = await priceResponse.json()

      // Process and combine the data
      const assets: CryptoAsset[] = balanceData
        .filter((balance: any) => parseFloat(balance.balance) > 0)
        .map((balance: any) => {
          const market = marketData.find((m: any) => m.symbol === balance.currency)
          const price = market?.last_price || 0
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
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Error fetching portfolio:', err)
      setError('Failed to load portfolio data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolio()
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchPortfolio, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

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
              <h1 className="text-2xl font-bold tracking-tight">Crypto Portfolio</h1>
              <p className="text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
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