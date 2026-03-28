import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'

type StrategyEntry = {
  symbol: string
  mode: string
  total: number
  wins: number
  winRate: number
  avgConfidence: number
  bestStreak: number
  currentStreak: number
  confidenceSum: number
}

function buildStrategies(
  records: { symbol: string; mode: string; outcome: string; confidence: number }[]
): StrategyEntry[] {
  const map = new Map<string, StrategyEntry>()

  for (const r of records) {
    const key = `${r.symbol}::${r.mode}`
    if (!map.has(key)) {
      map.set(key, {
        symbol: r.symbol,
        mode: r.mode,
        total: 0,
        wins: 0,
        winRate: 0,
        avgConfidence: 0,
        bestStreak: 0,
        currentStreak: 0,
        confidenceSum: 0,
      })
    }
    const e = map.get(key)!

    if (r.outcome === 'PENDING') continue
    e.total++
    e.confidenceSum += r.confidence

    if (r.outcome === 'HIT_TP1') {
      e.wins++
      e.currentStreak++
      if (e.currentStreak > e.bestStreak) e.bestStreak = e.currentStreak
    } else if (r.outcome === 'HIT_SL' || r.outcome === 'EXPIRED') {
      e.currentStreak = 0
    }
  }

  return Array.from(map.values())
    .filter((e) => e.total >= 5)
    .map((e) => ({
      ...e,
      winRate: Math.round((e.wins / e.total) * 1000) / 10,
      avgConfidence: Math.round(e.confidenceSum / e.total),
    }))
}

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 30_000

export async function GET(request: Request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const cacheKey = 'leaderboard-v2'
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  const now = new Date()
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [allRecords, records30d, records7d] = await Promise.all([
    prisma.signalRecord.findMany({
      orderBy: { createdAt: 'asc' },
      select: { symbol: true, mode: true, outcome: true, confidence: true },
    }),
    prisma.signalRecord.findMany({
      where: { createdAt: { gte: since30d } },
      orderBy: { createdAt: 'asc' },
      select: { symbol: true, mode: true, outcome: true, confidence: true },
    }),
    prisma.signalRecord.findMany({
      where: { createdAt: { gte: since7d } },
      orderBy: { createdAt: 'asc' },
      select: { symbol: true, mode: true, outcome: true, confidence: true },
    }),
  ])

  const strategiesAll = buildStrategies(allRecords)
  const strategies30d = buildStrategies(records30d)
  const strategies7d = buildStrategies(records7d)

  // Top 10 by 30-day win rate
  const top10 = strategies30d
    .sort((a, b) => b.winRate - a.winRate || b.total - a.total)
    .slice(0, 10)
    .map((s, i) => {
      const allTime = strategiesAll.find((a) => a.symbol === s.symbol && a.mode === s.mode)
      const sevenDay = strategies7d.find((a) => a.symbol === s.symbol && a.mode === s.mode)
      return {
        rank: i + 1,
        symbol: s.symbol,
        mode: s.mode,
        winRate30d: s.winRate,
        winRate7d: sevenDay?.winRate ?? null,
        winRateAll: allTime?.winRate ?? null,
        totalSignals: s.total,
        winCount: s.wins,
        avgConfidence: s.avgConfidence,
        bestStreak: s.bestStreak,
      }
    })

  // Best combos — top 3 across all time periods with at least 5 signals
  const comboMap = new Map<string, {
    symbol: string
    mode: string
    winRate7d: number | null
    winRate30d: number | null
    winRateAll: number | null
    totalAll: number
    score: number
  }>()

  for (const s of strategiesAll) {
    const key = `${s.symbol}::${s.mode}`
    const d30 = strategies30d.find((x) => x.symbol === s.symbol && x.mode === s.mode)
    const d7 = strategies7d.find((x) => x.symbol === s.symbol && x.mode === s.mode)
    // Score: weighted average of all-time and 30-day win rate
    const score = (s.winRate * 0.4) + ((d30?.winRate ?? 0) * 0.4) + ((d7?.winRate ?? 0) * 0.2)
    comboMap.set(key, {
      symbol: s.symbol,
      mode: s.mode,
      winRate7d: d7?.winRate ?? null,
      winRate30d: d30?.winRate ?? null,
      winRateAll: s.winRate,
      totalAll: s.total,
      score,
    })
  }

  const bestCombos = Array.from(comboMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...rest }) => rest)

  // Summary stats
  const resolvedAll = allRecords.filter((r) => r.outcome === 'HIT_TP1' || r.outcome === 'HIT_SL')
  const winsAll = allRecords.filter((r) => r.outcome === 'HIT_TP1').length
  const overallWinRate = resolvedAll.length > 0 ? Math.round((winsAll / resolvedAll.length) * 1000) / 10 : 0
  const totalStrategies = strategiesAll.length

  // Period-specific leaderboards for tab display
  const leaderboards = {
    '7d': strategies7d
      .sort((a, b) => b.winRate - a.winRate || b.total - a.total)
      .slice(0, 10)
      .map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        mode: s.mode,
        winRate: s.winRate,
        totalSignals: s.total,
        winCount: s.wins,
        avgConfidence: s.avgConfidence,
        bestStreak: s.bestStreak,
      })),
    '30d': top10.map((s) => ({
      rank: s.rank,
      symbol: s.symbol,
      mode: s.mode,
      winRate: s.winRate30d,
      totalSignals: s.totalSignals,
      winCount: s.winCount,
      avgConfidence: s.avgConfidence,
      bestStreak: s.bestStreak,
    })),
    'all': strategiesAll
      .sort((a, b) => b.winRate - a.winRate || b.total - a.total)
      .slice(0, 10)
      .map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        mode: s.mode,
        winRate: s.winRate,
        totalSignals: s.total,
        winCount: s.wins,
        avgConfidence: s.avgConfidence,
        bestStreak: s.bestStreak,
      })),
  }

  const result = {
    top10,
    bestCombos,
    leaderboards,
    summary: {
      totalSignals: allRecords.length,
      overallWinRate,
      totalStrategies,
    },
  }

  cache.set(cacheKey, { data: result, ts: Date.now() })
  return NextResponse.json(result)
}
