import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'
import { type SessionData, sessionOptions } from '@/app/lib/session'

export async function GET(request: Request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Get all resolved signals grouped by symbol+mode
  const allRecords = await prisma.signalRecord.findMany({
    where: { outcome: { not: 'PENDING' } },
    select: { symbol: true, mode: true, outcome: true },
    orderBy: { createdAt: 'asc' },
  })

  // Build community strategy stats
  type Stats = { total: number; wins: number }
  const strategyMap = new Map<string, Stats>()

  for (const r of allRecords) {
    const key = `${r.symbol}::${r.mode}`
    if (!strategyMap.has(key)) strategyMap.set(key, { total: 0, wins: 0 })
    const s = strategyMap.get(key)!
    s.total++
    if (r.outcome === 'HIT_TP1') s.wins++
  }

  // Community averages
  const strategies = Array.from(strategyMap.values()).filter((s) => s.total >= 5)
  const communityWinRates = strategies.map((s) => Math.round((s.wins / s.total) * 1000) / 10)
  const communityAvgWinRate = communityWinRates.length > 0
    ? Math.round(communityWinRates.reduce((a, b) => a + b, 0) / communityWinRates.length * 10) / 10
    : 0
  const communityTotalSignals = allRecords.length
  const communityTotalUsers = strategies.length

  // User personal stats — we use all signals as user-agnostic (SignalRecord has no userId)
  // For now, return community-wide personal stats as a placeholder
  // In a future iteration, SignalRecord could be tied to userId for per-user tracking
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId: session.userId },
    select: { signalHistory: true },
  })

  let userWinRate = 0
  let userTotalSignals = 0
  let userWins = 0

  if (userSettings?.signalHistory) {
    try {
      const history = JSON.parse(userSettings.signalHistory) as Array<{
        outcome?: string
      }>
      for (const h of history) {
        if (h.outcome === 'HIT_TP1' || h.outcome === 'HIT_SL' || h.outcome === 'EXPIRED') {
          userTotalSignals++
          if (h.outcome === 'HIT_TP1') userWins++
        }
      }
      userWinRate = userTotalSignals > 0 ? Math.round((userWins / userTotalSignals) * 1000) / 10 : 0
    } catch {
      // Invalid JSON — ignore
    }
  }

  // Rank: how many strategies have lower win rate than user
  const rank = userTotalSignals >= 5
    ? communityWinRates.filter((wr) => wr > userWinRate).length + 1
    : null
  const percentile = rank !== null && communityTotalUsers > 0
    ? Math.round(((communityTotalUsers - rank) / communityTotalUsers) * 100)
    : null

  return NextResponse.json({
    user: {
      winRate: userWinRate,
      totalSignals: userTotalSignals,
      wins: userWins,
      rank,
      percentile,
    },
    community: {
      avgWinRate: communityAvgWinRate,
      totalSignals: communityTotalSignals,
      totalStrategies: communityTotalUsers,
    },
  })
}
