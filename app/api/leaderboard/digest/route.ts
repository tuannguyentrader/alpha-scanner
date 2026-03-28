import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'

// TODO: Integrate with an email service (e.g. Resend, SendGrid) to actually send
// weekly digest emails to Pro users. This route generates the digest data payload.
// Trigger via cron job every Monday at 9:00 UTC.

export async function GET(request: Request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const now = new Date()
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const records7d = await prisma.signalRecord.findMany({
    where: { createdAt: { gte: since7d }, outcome: { not: 'PENDING' } },
    select: { symbol: true, mode: true, outcome: true, confidence: true },
    orderBy: { createdAt: 'asc' },
  })

  // Aggregate 7-day stats by strategy
  type Entry = { symbol: string; mode: string; total: number; wins: number }
  const map = new Map<string, Entry>()

  for (const r of records7d) {
    const key = `${r.symbol}::${r.mode}`
    if (!map.has(key)) map.set(key, { symbol: r.symbol, mode: r.mode, total: 0, wins: 0 })
    const e = map.get(key)!
    e.total++
    if (r.outcome === 'HIT_TP1') e.wins++
  }

  const strategies = Array.from(map.values())
    .filter((e) => e.total >= 3)
    .map((e) => ({
      symbol: e.symbol,
      mode: e.mode,
      winRate: Math.round((e.wins / e.total) * 1000) / 10,
      total: e.total,
      wins: e.wins,
    }))
    .sort((a, b) => b.winRate - a.winRate)

  const top3 = strategies.slice(0, 3)

  const totalResolved = records7d.length
  const totalWins = records7d.filter((r) => r.outcome === 'HIT_TP1').length
  const overallWinRate = totalResolved > 0 ? Math.round((totalWins / totalResolved) * 1000) / 10 : 0

  // TODO: For each Pro user, compute their personal 7-day win rate and rank change
  // by querying their signalHistory from UserSettings. Then dispatch email via
  // email service with personalized digest data.

  return NextResponse.json({
    weekEnding: now.toISOString(),
    community: {
      overallWinRate,
      totalSignals: totalResolved,
      top3Performers: top3,
    },
    // TODO: Add per-user digest when email service is integrated:
    // userDigest: { winRate7d, rankChange, vsTopPerformer }
  })
}
