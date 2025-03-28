import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  const API_KEY = process.env.NEXT_PUBLIC_BINANCE_API_KEY
  const API_SECRET = process.env.NEXT_PUBLIC_BINANCE_API_SECRET

  if (!API_KEY || !API_SECRET) {
    console.error('Missing API credentials:', { API_KEY: !!API_KEY, API_SECRET: !!API_SECRET })
    return NextResponse.json(
      { error: 'API credentials not configured' },
      { status: 401 }
    )
  }

  try {
    // First, get Binance server time to ensure our timestamp is synchronized
    const timeResponse = await fetch('https://api.binance.com/api/v3/time', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json'
      }
    })

    if (!timeResponse.ok) {
      console.error('Failed to fetch server time')
      return NextResponse.json(
        { error: 'Failed to synchronize with Binance server time' },
        { status: 500 }
      )
    }

    const { serverTime } = await timeResponse.json()
    
    // Use server time and a larger recvWindow
    const timestamp = serverTime
    const recvWindow = 10000 // 10 seconds window

    // Create signature for account info with recvWindow
    const accountQueryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`
    const accountSignature = crypto
      .createHmac('sha256', API_SECRET)
      .update(accountQueryString)
      .digest('hex')

    // Fetch account information with proper parameters
    const accountResponse = await fetch(
      `https://api.binance.com/api/v3/account?${accountQueryString}&signature=${accountSignature}`,
      {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': API_KEY,
          'User-Agent': 'Mozilla/5.0',
          'Content-Type': 'application/json'
        }
      }
    )

    if (!accountResponse.ok) {
      const error = await accountResponse.json()
      console.error('Balance API Error:', error)
      return NextResponse.json(
        { error: error.msg || 'Failed to fetch balance data' },
        { status: accountResponse.status }
      )
    }

    const accountData = await accountResponse.json()
    
    // Filter non-zero balances
    const balances = accountData.balances.filter(
      (balance: any) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
    )

    // Fetch current prices for all symbols
    const priceResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json'
      }
    })

    if (!priceResponse.ok) {
      const error = await priceResponse.json()
      console.error('Market API Error:', error)
      return NextResponse.json(
        { error: error.msg || 'Failed to fetch market data' },
        { status: priceResponse.status }
      )
    }

    const priceData = await priceResponse.json()

    // Process and combine the data
    const processedData = {
      balanceData: balances.map((balance: any) => ({
        currency: balance.asset,
        balance: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
        available_balance: balance.free,
        locked_balance: balance.locked
      })),
      marketData: priceData.map((ticker: any) => ({
        symbol: ticker.symbol,
        last_price: parseFloat(ticker.lastPrice),
        change_24_hour: parseFloat(ticker.priceChangePercent)
      }))
    }

    return NextResponse.json(processedData)
  } catch (error) {
    console.error('Portfolio API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch portfolio data' },
      { status: 500 }
    )
  }
} 