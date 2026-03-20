'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithRetry } from '@/app/lib/fetchWithRetry'
import type { TradingMode, RiskProfile } from '@/app/data/mockSignals'
import type { BacktestResult } from '@/app/lib/backtestEngine'

export function useBacktest(symbol: string, mode: TradingMode, risk: RiskProfile) {
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBacktest = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ symbol, mode, risk })
      const res = await fetchWithRetry(`/api/backtest?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as BacktestResult
      setResult(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch backtest')
    } finally {
      setLoading(false)
    }
  }, [symbol, mode, risk])

  useEffect(() => {
    void fetchBacktest()
    const interval = setInterval(() => void fetchBacktest(), 5 * 60_000) // 5 min refresh
    return () => clearInterval(interval)
  }, [fetchBacktest])

  return { result, loading, error, refetch: fetchBacktest }
}
