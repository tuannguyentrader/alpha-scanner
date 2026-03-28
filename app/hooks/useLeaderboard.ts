'use client'

import { useState, useEffect, useCallback } from 'react'

export type Period = '7d' | '30d' | 'all'

export type LeaderboardEntry = {
  rank: number
  symbol: string
  mode: string
  winRate: number
  totalSignals: number
  winCount: number
  avgConfidence: number
  bestStreak: number
}

export type BestCombo = {
  symbol: string
  mode: string
  winRate7d: number | null
  winRate30d: number | null
  winRateAll: number | null
  totalAll: number
}

export type LeaderboardSummary = {
  totalSignals: number
  overallWinRate: number
  totalStrategies: number
}

export type UserRank = {
  user: {
    winRate: number
    totalSignals: number
    wins: number
    rank: number | null
    percentile: number | null
  }
  community: {
    avgWinRate: number
    totalSignals: number
    totalStrategies: number
  }
}

type LeaderboardV2Response = {
  leaderboards: Record<Period, LeaderboardEntry[]>
  bestCombos: BestCombo[]
  summary: LeaderboardSummary
}

export function useLeaderboard() {
  const [data, setData] = useState<Record<Period, LeaderboardEntry[]>>({ '7d': [], '30d': [], 'all': [] })
  const [bestCombos, setBestCombos] = useState<BestCombo[]>([])
  const [summary, setSummary] = useState<LeaderboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('30d')

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/leaderboard/v2')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: LeaderboardV2Response = await res.json()
      setData(json.leaderboards)
      setBestCombos(json.bestCombos)
      setSummary(json.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 60_000)
    return () => clearInterval(interval)
  }, [fetchLeaderboard])

  return { data, bestCombos, summary, loading, error, period, setPeriod }
}

export function useUserRank() {
  const [userRank, setUserRank] = useState<UserRank | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRank() {
      try {
        const res = await fetch('/api/leaderboard/v2/rank')
        if (res.status === 401) {
          setUserRank(null)
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: UserRank = await res.json()
        setUserRank(json)
      } catch {
        setUserRank(null)
      } finally {
        setLoading(false)
      }
    }
    fetchRank()
  }, [])

  return { userRank, loading }
}
