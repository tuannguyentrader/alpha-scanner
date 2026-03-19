import { NextResponse } from 'next/server'

export interface SymbolPrice {
  price: number
  change24h: number
}

export interface PricesResponse {
  prices: Record<string, SymbolPrice>
  timestamp: number
  source: string
}

/* ── Fallback prices ──────────────────────────────────────────────────────── */

const FALLBACK_PRICES: Record<string, SymbolPrice> = {
  XAUUSD: { price: 2920, change24h: 0 },
  XAGUSD: { price: 32.5, change24h: 0 },
  BTCUSD: { price: 84000, change24h: 0 },
  ETHUSD: { price: 1920, change24h: 0 },
  XRPUSD: { price: 2.35, change24h: 0 },
}

/* ── In-memory cache ──────────────────────────────────────────────────────── */

let cache: { data: PricesResponse; expiresAt: number } | null = null
const CACHE_TTL = 30_000

/* ── Fetchers ─────────────────────────────────────────────────────────────── */

async function fetchCryptoPrices(): Promise<Record<string, SymbolPrice>> {
  const url =
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple&vs_currencies=usd&include_24hr_change=true'
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const data = (await res.json()) as {
    bitcoin: { usd: number; usd_24h_change?: number }
    ethereum: { usd: number; usd_24h_change?: number }
    ripple: { usd: number; usd_24h_change?: number }
  }
  return {
    BTCUSD: { price: data.bitcoin.usd, change24h: data.bitcoin.usd_24h_change ?? 0 },
    ETHUSD: { price: data.ethereum.usd, change24h: data.ethereum.usd_24h_change ?? 0 },
    XRPUSD: { price: data.ripple.usd, change24h: data.ripple.usd_24h_change ?? 0 },
  }
}

async function fetchMetalsPrimary(): Promise<Record<string, SymbolPrice>> {
  // metals.live — free, no auth
  const res = await fetch('https://api.metals.live/v1/spot/gold,silver', {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`metals.live ${res.status}`)
  const data = (await res.json()) as Array<{ metal: string; price: number }>
  const result: Record<string, SymbolPrice> = {}
  for (const item of data) {
    if (item.metal === 'gold') result.XAUUSD = { price: item.price, change24h: 0 }
    if (item.metal === 'silver') result.XAGUSD = { price: item.price, change24h: 0 }
  }
  if (!result.XAUUSD || !result.XAGUSD) throw new Error('Incomplete metals data')
  return result
}

async function fetchMetalsSecondary(): Promise<Record<string, SymbolPrice>> {
  // fawazahmed0 currency API — free, no auth; gold is XAU, silver is XAG in USD
  const res = await fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json',
    { signal: AbortSignal.timeout(8000) },
  )
  if (!res.ok) throw new Error(`currency-api ${res.status}`)
  const xauData = (await res.json()) as { xau: Record<string, number> }
  const xauUsd = xauData.xau['usd']
  if (!xauUsd || xauUsd <= 0) throw new Error('Invalid XAU price')

  const res2 = await fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xag.json',
    { signal: AbortSignal.timeout(8000) },
  )
  if (!res2.ok) throw new Error(`currency-api XAG ${res2.status}`)
  const xagData = (await res2.json()) as { xag: Record<string, number> }
  const xagUsd = xagData.xag['usd']
  if (!xagUsd || xagUsd <= 0) throw new Error('Invalid XAG price')

  return {
    XAUUSD: { price: xauUsd, change24h: 0 },
    XAGUSD: { price: xagUsd, change24h: 0 },
  }
}

/* ── Main fetch orchestrator ─────────────────────────────────────────────── */

async function fetchAllPrices(): Promise<PricesResponse> {
  const sources: string[] = []
  const prices: Record<string, SymbolPrice> = {}

  // Crypto
  try {
    const crypto = await fetchCryptoPrices()
    Object.assign(prices, crypto)
    sources.push('coingecko')
  } catch {
    prices.BTCUSD = FALLBACK_PRICES.BTCUSD
    prices.ETHUSD = FALLBACK_PRICES.ETHUSD
    prices.XRPUSD = FALLBACK_PRICES.XRPUSD
    sources.push('fallback-crypto')
  }

  // Metals: try primary, then secondary, then fallback
  try {
    const metals = await fetchMetalsPrimary()
    Object.assign(prices, metals)
    sources.push('metals.live')
  } catch {
    try {
      const metals = await fetchMetalsSecondary()
      Object.assign(prices, metals)
      sources.push('currency-api')
    } catch {
      prices.XAUUSD = FALLBACK_PRICES.XAUUSD
      prices.XAGUSD = FALLBACK_PRICES.XAGUSD
      sources.push('fallback-metals')
    }
  }

  return { prices, timestamp: Date.now(), source: sources.join('+') }
}

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function GET() {
  const now = Date.now()

  if (cache && cache.expiresAt > now) {
    return NextResponse.json(cache.data)
  }

  try {
    const data = await fetchAllPrices()
    cache = { data, expiresAt: now + CACHE_TTL }
    return NextResponse.json(data)
  } catch {
    if (cache) return NextResponse.json(cache.data)
    const fallback: PricesResponse = {
      prices: { ...FALLBACK_PRICES },
      timestamp: now,
      source: 'fallback',
    }
    return NextResponse.json(fallback)
  }
}
