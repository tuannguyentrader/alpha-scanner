import { ImageResponse } from 'next/og'
import { prisma } from '@/app/lib/prisma'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const upperSymbol = symbol.toUpperCase()

  // Fetch stats for this symbol
  const records = await prisma.signalRecord.findMany({
    where: { symbol: upperSymbol, outcome: { not: 'PENDING' } },
    select: { outcome: true, mode: true, confidence: true },
  })

  const total = records.length
  const wins = records.filter((r) => r.outcome === 'HIT_TP1').length
  const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0
  const avgConfidence = total > 0
    ? Math.round(records.reduce((sum, r) => sum + r.confidence, 0) / total)
    : 0

  // Get rank among all symbols
  const allRecords = await prisma.signalRecord.findMany({
    where: { outcome: { not: 'PENDING' } },
    select: { symbol: true, outcome: true },
  })

  const symbolStats = new Map<string, { total: number; wins: number }>()
  for (const r of allRecords) {
    if (!symbolStats.has(r.symbol)) symbolStats.set(r.symbol, { total: 0, wins: 0 })
    const s = symbolStats.get(r.symbol)!
    s.total++
    if (r.outcome === 'HIT_TP1') s.wins++
  }

  const ranked = Array.from(symbolStats.entries())
    .filter(([, s]) => s.total >= 5)
    .map(([sym, s]) => ({ symbol: sym, winRate: s.wins / s.total }))
    .sort((a, b) => b.winRate - a.winRate)

  const rank = ranked.findIndex((r) => r.symbol === upperSymbol) + 1
  const totalSymbols = ranked.length

  const winRateColor = winRate >= 60 ? '#10B981' : winRate >= 50 ? '#a1a1aa' : '#f43f5e'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#050505',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div
            style={{
              fontSize: '24px',
              color: '#10B981',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            ALPHA SCANNER
          </div>
          <div
            style={{
              marginLeft: '16px',
              fontSize: '14px',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Signal Leaderboard
          </div>
        </div>

        {/* Symbol */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            marginBottom: '32px',
          }}
        >
          {upperSymbol}
        </div>

        {/* Stats grid */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '40px' }}>
          {/* Win Rate */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 32px',
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              minWidth: '200px',
            }}
          >
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Win Rate
            </div>
            <div style={{ fontSize: '48px', fontWeight: 800, color: winRateColor }}>
              {winRate}%
            </div>
          </div>

          {/* Signals */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 32px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              minWidth: '200px',
            }}
          >
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Signals
            </div>
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#e4e4e7' }}>
              {total}
            </div>
          </div>

          {/* Rank */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 32px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              minWidth: '200px',
            }}
          >
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Rank
            </div>
            <div style={{ fontSize: '48px', fontWeight: 800, color: rank <= 3 ? '#10B981' : '#e4e4e7' }}>
              {rank > 0 ? `#${rank}` : 'N/A'}
            </div>
          </div>

          {/* Confidence */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 32px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              minWidth: '200px',
            }}
          >
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Avg Confidence
            </div>
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#e4e4e7' }}>
              {avgConfidence}%
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', marginTop: 'auto', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '16px', color: '#6b7280' }}>
            {rank > 0 ? `Ranked #${rank} of ${totalSymbols} assets` : `${total} signals tracked`}
          </div>
          <div style={{ fontSize: '14px', color: '#4b5563' }}>
            alpha-scanner.vercel.app/leaderboard
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
