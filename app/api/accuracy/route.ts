import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'

export async function GET(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    const where = symbol ? { symbol, outcome: { not: 'PENDING' } } : { outcome: { not: 'PENDING' } }

    const records = await prisma.signalRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    // Aggregate stats by symbol
    const statsBySymbol = new Map<string, { total: number; tp1: number; sl: number; expired: number }>()

    for (const r of records) {
      const stats = statsBySymbol.get(r.symbol) ?? { total: 0, tp1: 0, sl: 0, expired: 0 }
      stats.total++
      if (r.outcome === 'HIT_TP1') stats.tp1++
      else if (r.outcome === 'HIT_SL') stats.sl++
      else if (r.outcome === 'EXPIRED') stats.expired++
      statsBySymbol.set(r.symbol, stats)
    }

    const accuracy = Array.from(statsBySymbol.entries()).map(([sym, stats]) => ({
      symbol: sym,
      total: stats.total,
      hitTP1: stats.tp1,
      hitSL: stats.sl,
      expired: stats.expired,
      winRate: stats.total > 0 ? Math.round((stats.tp1 / stats.total) * 100) : 0,
    }))

    // Overall stats
    const totalSignals = records.length
    const totalTP1 = records.filter((r) => r.outcome === 'HIT_TP1').length
    const totalSL = records.filter((r) => r.outcome === 'HIT_SL').length
    const totalExpired = records.filter((r) => r.outcome === 'EXPIRED').length
    const overallWinRate = totalSignals > 0 ? Math.round((totalTP1 / totalSignals) * 100) : 0

    // Pending count
    const pendingCount = await prisma.signalRecord.count({ where: { outcome: 'PENDING' } })

    return NextResponse.json({
      overall: {
        totalSignals,
        hitTP1: totalTP1,
        hitSL: totalSL,
        expired: totalExpired,
        winRate: overallWinRate,
        pending: pendingCount,
      },
      bySymbol: accuracy,
      recentRecords: records.slice(0, 50).map((r) => ({
        id: r.id,
        symbol: r.symbol,
        mode: r.mode,
        direction: r.direction,
        entryPrice: r.entryPrice,
        tp1: r.tp1,
        sl: r.sl,
        confidence: r.confidence,
        outcome: r.outcome,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch accuracy data' }, { status: 500 })
  }
}
