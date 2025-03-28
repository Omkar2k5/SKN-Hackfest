import { NextResponse } from 'next/server'
import crypto from 'crypto'

// API keys should be in environment variables
const API_KEY = process.env.NEXT_PUBLIC_COINDCX_API_KEY
const API_SECRET = process.env.NEXT_PUBLIC_COINDCX_API_SECRET

export async function GET() {
  try {
    if (!API_KEY || !API_SECRET) {
      throw new Error('API credentials not configured')
    }

    const timestamp = Date.now()
    const body = ""
    const signature = crypto
      .createHmac('sha256', API_SECRET)
      .update(body + timestamp)
      .digest('hex')

    // Fetch balances with proper headers
    const balanceResponse = await fetch('https://api.coindcx.com/exchange/v1/users/balances', {
      method: 'POST',
      headers: {
        'X-AUTH-APIKEY': API_KEY,
        'X-AUTH-SIGNATURE': signature,
        'X-AUTH-TIMESTAMP': timestamp.toString(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({}),
      cache: 'no-store'
    })

    let balanceData
    try {
      balanceData = await balanceResponse.json()
    } catch (e) {
      throw new Error('Failed to parse balance response')
    }

    if (!balanceResponse.ok) {
      console.error('Balance API Error:', {
        status: balanceResponse.status,
        statusText: balanceResponse.statusText,
        error: balanceData
      })
      throw new Error(balanceData.message || `Balance API failed: ${balanceResponse.status}`)
    }

    // Fetch market prices from public endpoint
    const priceResponse = await fetch('https://api.coindcx.com/exchange/ticker', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      cache: 'no-store'
    })

    let marketData
    try {
      marketData = await priceResponse.json()
    } catch (e) {
      throw new Error('Failed to parse market data response')
    }

    if (!priceResponse.ok) {
      console.error('Market API Error:', {
        status: priceResponse.status,
        statusText: priceResponse.statusText,
        error: marketData
      })
      throw new Error(marketData.message || `Market API failed: ${priceResponse.status}`)
    }

    // Transform market data to match expected format
    const formattedMarketData = Object.entries(marketData).map(([market, data]: [string, any]) => ({
      symbol: market,
      last_price: data.last_price,
      change_24_hour: data.change_24_hour
    }))

    return NextResponse.json({ 
      balanceData, 
      marketData: formattedMarketData,
      timestamp: Date.now() 
    })

  } catch (error) {
    console.error('Portfolio API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio data',
        timestamp: Date.now()
      },
      { status: 500 }
    )
  }
} 