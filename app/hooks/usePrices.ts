'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface SymbolPrice {
  price: number
  change24h: number
}

interface PricesApiResponse {
  prices: Record<string, SymbolPrice>
  timestamp: number
  source: string
}

export interface UsePricesReturn {
  prices: Record<string, SymbolPrice> | null
  loading: boolean
  error: string | null
  lastUpdated: number | null
}

const REFRESH_INTERVAL = 30_000

export function usePrices(): UsePricesReturn {
  const [prices, setPrices] = useState<Record<string, SymbolPrice> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: PricesApiResponse = await res.json()
      setPrices(data.prices)
      setLastUpdated(data.timestamp)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    intervalRef.current = setInterval(fetchPrices, REFRESH_INTERVAL)
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [fetchPrices])

  return { prices, loading, error, lastUpdated }
}
