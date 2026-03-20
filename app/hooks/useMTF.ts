'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchWithRetry } from '@/app/lib/fetchWithRetry'
import type { MTFResponse } from '@/app/api/mtf/route'

export function useMTF(symbol: string) {
  const [data, setData] = useState<MTFResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMTF = useCallback(async () => {
    try {
      const res = await fetchWithRetry(`/api/mtf?symbol=${encodeURIComponent(symbol)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as MTFResponse
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch MTF')
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    setLoading(true)
    void fetchMTF()
    const interval = setInterval(() => void fetchMTF(), 60_000)
    return () => clearInterval(interval)
  }, [fetchMTF])

  return { data, loading, error }
}
