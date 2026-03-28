'use client'

import { useLeaderboard, useUserRank, type Period, type LeaderboardEntry, type BestCombo } from '../hooks/useLeaderboard'

/* ── Win rate bar ───────────────────────────────────────────────────────────── */

function WinRateBar({ value }: { value: number }) {
  const color = value >= 60 ? '#10b981' : value >= 50 ? '#a1a1aa' : '#f43f5e'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden" style={{ minWidth: '60px' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-[10px] font-bold w-10 text-right" style={{ color }}>
        {value.toFixed(1)}%
      </span>
    </div>
  )
}

/* ── Rank badge ─────────────────────────────────────────────────────────────── */

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base leading-none">&#x1F947;</span>
  if (rank === 2) return <span className="text-base leading-none">&#x1F948;</span>
  if (rank === 3) return <span className="text-base leading-none">&#x1F949;</span>
  return <span className="font-mono text-[10px] text-zinc-500 w-6 text-center inline-block">{rank}</span>
}

/* ── Loading skeleton ───────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-white/[0.04]" />
      ))}
    </div>
  )
}

/* ── Summary cards ──────────────────────────────────────────────────────────── */

function SummaryCards({
  totalSignals,
  overallWinRate,
  totalStrategies,
}: {
  totalSignals: number
  overallWinRate: number
  totalStrategies: number
}) {
  const cards = [
    { label: 'Total Signals', value: totalSignals.toLocaleString(), accent: false },
    { label: 'Overall Win Rate', value: `${overallWinRate.toFixed(1)}%`, accent: overallWinRate >= 55 },
    { label: 'Active Strategies', value: totalStrategies.toString(), accent: false },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-emerald-500/10 bg-white/[0.03] px-3 py-3 text-center backdrop-blur-sm"
        >
          <div
            className="text-base font-bold font-mono"
            style={{ color: c.accent ? '#10b981' : '#e4e4e7' }}
          >
            {c.value}
          </div>
          <div className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-widest">{c.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Your Rank card ─────────────────────────────────────────────────────────── */

function YourRankCard() {
  const { userRank, loading } = useUserRank()

  if (loading) {
    return (
      <div className="mb-5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4 backdrop-blur-sm animate-pulse">
        <div className="h-16 rounded bg-white/[0.04]" />
      </div>
    )
  }

  if (!userRank) return null

  const { user, community } = userRank
  const hasRank = user.rank !== null

  return (
    <div className="mb-5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <span className="text-[10px] text-emerald-400">&#x2605;</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-semibold">Your Rank</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="text-2xl font-black font-mono text-white">
            {hasRank ? `#${user.rank}` : '—'}
          </div>
          <div className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">
            {hasRank ? `of ${community.totalStrategies}` : 'Need 5+ signals'}
          </div>
        </div>

        <div>
          <div className="text-2xl font-black font-mono" style={{ color: user.winRate >= community.avgWinRate ? '#10b981' : '#f43f5e' }}>
            {user.winRate.toFixed(1)}%
          </div>
          <div className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">Your Win Rate</div>
        </div>

        <div>
          <div className="text-2xl font-black font-mono text-zinc-300">
            {user.percentile !== null ? `${user.percentile}%` : '—'}
          </div>
          <div className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">Percentile</div>
        </div>

        <div>
          <div className="text-2xl font-black font-mono text-zinc-400">
            {community.avgWinRate.toFixed(1)}%
          </div>
          <div className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">Community Avg</div>
        </div>
      </div>
    </div>
  )
}

/* ── Best combos ────────────────────────────────────────────────────────────── */

function BestCombos({ combos }: { combos: BestCombo[] }) {
  if (combos.length === 0) return null

  return (
    <div className="mb-5">
      <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-2 font-semibold">Best Asset/Mode Combos</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {combos.map((c, i) => (
          <div
            key={`${c.symbol}::${c.mode}`}
            className="rounded-xl border bg-white/[0.03] px-3 py-3 backdrop-blur-sm"
            style={{
              borderColor: i === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              background: i === 0 ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.03)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {i === 0 && <span className="text-xs">&#x1F451;</span>}
              <span className="font-semibold text-white text-xs">{c.symbol}</span>
              <span className="rounded border border-emerald-500/20 bg-emerald-500/[0.06] px-1.5 py-0.5 text-[7px] font-semibold uppercase text-emerald-400/70">
                {c.mode}
              </span>
            </div>
            <div className="flex gap-3 text-[9px]">
              {c.winRate7d !== null && (
                <div>
                  <span className="text-zinc-600">7d </span>
                  <span className="font-mono font-bold" style={{ color: c.winRate7d >= 60 ? '#10b981' : '#a1a1aa' }}>
                    {c.winRate7d}%
                  </span>
                </div>
              )}
              {c.winRate30d !== null && (
                <div>
                  <span className="text-zinc-600">30d </span>
                  <span className="font-mono font-bold" style={{ color: c.winRate30d >= 60 ? '#10b981' : '#a1a1aa' }}>
                    {c.winRate30d}%
                  </span>
                </div>
              )}
              {c.winRateAll !== null && (
                <div>
                  <span className="text-zinc-600">All </span>
                  <span className="font-mono font-bold" style={{ color: c.winRateAll >= 60 ? '#10b981' : '#a1a1aa' }}>
                    {c.winRateAll}%
                  </span>
                </div>
              )}
              <div className="ml-auto text-zinc-600">{c.totalAll} signals</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Strategy table ─────────────────────────────────────────────────────────── */

function StrategyTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="text-3xl mb-2 opacity-40">&#x1F3C6;</div>
        <p className="text-xs text-zinc-500">No ranked entries yet</p>
        <p className="text-[9px] text-zinc-700 mt-1">
          At least 5 resolved signals per pair are required to appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['Rank', 'Symbol', 'Mode', 'Signals', 'Win Rate', 'Confidence', 'Streak'].map((h) => (
              <th
                key={h}
                className="px-2 py-1.5 text-left font-semibold uppercase tracking-widest text-zinc-600"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={`${entry.symbol}::${entry.mode}`}
              className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-2 py-2.5">
                <RankBadge rank={entry.rank} />
              </td>
              <td className="px-2 py-2.5">
                <span className="font-semibold text-white">{entry.symbol}</span>
              </td>
              <td className="px-2 py-2.5">
                <span className="rounded border border-emerald-500/20 bg-emerald-500/[0.06] px-1.5 py-0.5 text-[8px] font-semibold uppercase text-emerald-400/70">
                  {entry.mode}
                </span>
              </td>
              <td className="px-2 py-2.5 text-zinc-400">
                <span className="text-emerald-400">{entry.winCount}</span>
                <span className="text-zinc-600">/{entry.totalSignals}</span>
              </td>
              <td className="px-2 py-2.5" style={{ minWidth: '130px' }}>
                <WinRateBar value={entry.winRate} />
              </td>
              <td className="px-2 py-2.5 text-center">
                <span className="font-mono text-[10px] text-zinc-400">
                  {entry.avgConfidence}%
                </span>
              </td>
              <td className="px-2 py-2.5 text-center">
                <span
                  className="font-mono font-bold text-[10px]"
                  style={{ color: entry.bestStreak >= 3 ? '#10b981' : '#6b7280' }}
                >
                  {entry.bestStreak > 0 ? `${entry.bestStreak}W` : '\u2014'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */

const PERIODS: { label: string; value: Period }[] = [
  { label: '7 Day', value: '7d' },
  { label: '30 Day', value: '30d' },
  { label: 'All Time', value: 'all' },
]

export default function Leaderboard() {
  const { data, bestCombos, summary, loading, error, period, setPeriod } = useLeaderboard()

  const entries = data[period] ?? []

  return (
    <div>
      {/* Your Rank card (only shown for authenticated users) */}
      <YourRankCard />

      {/* Best Combos section */}
      {!loading && <BestCombos combos={bestCombos} />}

      {/* Main leaderboard */}
      <div className="rounded-2xl border border-emerald-500/10 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
        {/* Period tabs */}
        <div className="flex border-b border-white/[0.06]">
          {PERIODS.map((p) => {
            const active = period === p.value
            return (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className="flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-widest transition-colors"
                style={{
                  color: active ? '#10b981' : '#6b7280',
                  borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
                  background: active ? 'rgba(16,185,129,0.04)' : 'transparent',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <div className="px-4 py-4 sm:px-5">
          {/* Summary cards */}
          {summary && !loading && (
            <SummaryCards
              totalSignals={summary.totalSignals}
              overallWinRate={summary.overallWinRate}
              totalStrategies={summary.totalStrategies}
            />
          )}

          {loading ? (
            <Skeleton />
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-xs text-rose-400">Failed to load leaderboard</p>
              <p className="text-[9px] text-zinc-600 mt-1">{error}</p>
            </div>
          ) : (
            <StrategyTable entries={entries} />
          )}

          <p className="mt-3 text-[8px] text-zinc-700">
            Ranked by win rate &middot; Min 5 resolved signals to qualify &middot; Server-side data &middot; Refreshes every 60s
          </p>
        </div>
      </div>
    </div>
  )
}
