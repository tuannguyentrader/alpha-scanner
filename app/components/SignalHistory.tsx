'use client'

import { useState } from 'react'
import type { SignalRecord, SignalHistoryStats } from '../hooks/useSignalHistory'
import { fmt } from '../lib/symbols'
import { getAllSymbols } from '../lib/symbols'
import type { TradingMode } from '../data/mockSignals'

interface SignalHistoryProps {
  records: SignalRecord[]
  stats: SignalHistoryStats
  onClear: () => void
  getFilteredRecords: (filters?: {
    symbol?: string
    mode?: TradingMode
    outcome?: 'win' | 'loss' | 'pending'
  }) => SignalRecord[]
}

export default function SignalHistory({
  records,
  stats,
  onClear,
  getFilteredRecords,
}: SignalHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [tab, setTab] = useState<'timeline' | 'stats'>('timeline')
  const [filterSymbol, setFilterSymbol] = useState<string>('')
  const [filterMode, setFilterMode] = useState<string>('')
  const [filterOutcome, setFilterOutcome] = useState<string>('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const filteredRecords = getFilteredRecords({
    symbol: filterSymbol || undefined,
    mode: (filterMode as TradingMode) || undefined,
    outcome: (filterOutcome as 'win' | 'loss' | 'pending') || undefined,
  })

  const displayRecords = [...filteredRecords].reverse().slice(0, 50)

  return (
    <div
      className="rounded-lg border border-[#222] bg-[#111] overflow-hidden"
      style={{ borderTopColor: '#8b5cf6', borderTopWidth: '2px' }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 sm:px-5 text-left transition-colors hover:bg-[#1a1a1a]"
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: '#8b5cf6', boxShadow: '0 0 6px #8b5cf6' }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-white">Signal History</h3>
          <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
            {records.length}
          </span>
          {stats.winRate > 0 && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: stats.winRate >= 50 ? '#22c55e18' : '#ef444418',
                color: stats.winRate >= 50 ? '#22c55e' : '#ef4444',
              }}
            >
              {stats.winRate.toFixed(0)}% Win
            </span>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-[#222]">
          {/* Tabs */}
          <div className="flex border-b border-[#222]">
            <button
              onClick={() => setTab('timeline')}
              className="flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors"
              style={{
                color: tab === 'timeline' ? '#8b5cf6' : '#4b5563',
                borderBottom: tab === 'timeline' ? '2px solid #8b5cf6' : '2px solid transparent',
              }}
            >
              Timeline
            </button>
            <button
              onClick={() => setTab('stats')}
              className="flex-1 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors"
              style={{
                color: tab === 'stats' ? '#8b5cf6' : '#4b5563',
                borderBottom: tab === 'stats' ? '2px solid #8b5cf6' : '2px solid transparent',
              }}
            >
              Win Rate
            </button>
          </div>

          {tab === 'timeline' ? (
            <div className="px-4 py-4 sm:px-5 space-y-3">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterSymbol}
                  onChange={(e) => setFilterSymbol(e.target.value)}
                  className="rounded border border-[#222] bg-[#1a1a1a] px-2 py-1 text-[10px] text-gray-400 outline-none focus:border-[#8b5cf6]"
                >
                  <option value="">All Symbols</option>
                  {getAllSymbols().map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.icon} {s.symbol}
                    </option>
                  ))}
                </select>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="rounded border border-[#222] bg-[#1a1a1a] px-2 py-1 text-[10px] text-gray-400 outline-none focus:border-[#8b5cf6]"
                >
                  <option value="">All Modes</option>
                  <option value="swing">Swing</option>
                  <option value="intraday">Intraday</option>
                  <option value="scalper">Scalper</option>
                </select>
                <select
                  value={filterOutcome}
                  onChange={(e) => setFilterOutcome(e.target.value)}
                  className="rounded border border-[#222] bg-[#1a1a1a] px-2 py-1 text-[10px] text-gray-400 outline-none focus:border-[#8b5cf6]"
                >
                  <option value="">All Outcomes</option>
                  <option value="win">✅ Win</option>
                  <option value="loss">❌ Loss</option>
                  <option value="pending">⏳ Pending</option>
                </select>
              </div>

              {/* Records */}
              {displayRecords.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="mb-2 text-2xl opacity-30">📊</div>
                  <p className="text-xs text-gray-500">No signals recorded yet</p>
                  <p className="mt-0.5 text-[9px] text-gray-700">
                    Signals are automatically recorded when they fire
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {displayRecords.map((record) => (
                    <SignalRow key={record.id} record={record} />
                  ))}
                </div>
              )}

              {/* Clear */}
              {records.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                  {!showClearConfirm ? (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="text-[9px] text-gray-700 hover:text-gray-500 transition-colors"
                    >
                      Clear History
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500">Clear all signals?</span>
                      <button
                        onClick={() => { onClear(); setShowClearConfirm(false) }}
                        className="text-[9px] text-[#ef4444] font-semibold hover:text-[#f87171]"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="text-[9px] text-gray-600 hover:text-gray-400"
                      >
                        No
                      </button>
                    </div>
                  )}
                  <span className="text-[8px] text-gray-700">
                    Showing {displayRecords.length} of {filteredRecords.length}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-4 sm:px-5 space-y-4">
              {/* Overall stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCard label="Total" value={String(stats.totalSignals)} color="#8b5cf6" />
                <StatCard label="Wins" value={String(stats.wins)} color="#22c55e" />
                <StatCard label="Losses" value={String(stats.losses)} color="#ef4444" />
                <StatCard
                  label="Win Rate"
                  value={stats.wins + stats.losses > 0 ? `${stats.winRate.toFixed(1)}%` : '—'}
                  color={stats.winRate >= 50 ? '#22c55e' : '#ef4444'}
                />
              </div>

              {/* By symbol */}
              {Object.keys(stats.bySymbol).length > 0 && (
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
                    By Symbol
                  </span>
                  <div className="space-y-1">
                    {Object.entries(stats.bySymbol)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([symbol, data]) => (
                        <WinRateBar key={symbol} label={symbol} data={data} />
                      ))}
                  </div>
                </div>
              )}

              {/* By mode */}
              {Object.keys(stats.byMode).length > 0 && (
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
                    By Mode
                  </span>
                  <div className="space-y-1">
                    {Object.entries(stats.byMode).map(([mode, data]) => (
                      <WinRateBar key={mode} label={mode} data={data} />
                    ))}
                  </div>
                </div>
              )}

              {/* Pending */}
              {stats.pending > 0 && (
                <div className="text-center">
                  <span className="text-[9px] text-gray-600">
                    {stats.pending} signal{stats.pending > 1 ? 's' : ''} still pending (checked against live price)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function SignalRow({ record }: { record: SignalRecord }) {
  const dirColor = record.direction === 'BUY' ? '#3b82f6' : '#ef4444'
  const outcomeColor =
    record.outcome === 'win' ? '#22c55e' : record.outcome === 'loss' ? '#ef4444' : '#f59e0b'
  const outcomeIcon =
    record.outcome === 'win' ? '✅' : record.outcome === 'loss' ? '❌' : '⏳'

  const time = new Date(record.timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center justify-between rounded border border-[#222] bg-[#1a1a1a] px-3 py-2 transition-colors hover:bg-[#202020]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px]">{outcomeIcon}</span>
        <span className="text-xs font-semibold text-white">{record.symbol}</span>
        <span
          className="rounded px-1 py-0.5 text-[8px] font-bold uppercase"
          style={{ backgroundColor: `${dirColor}18`, color: dirColor }}
        >
          {record.direction}
        </span>
        <span className="text-[8px] text-gray-600 capitalize">{record.mode}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-mono text-[9px] text-gray-500">
          {fmt(record.symbol, record.entryPrice)}
        </span>
        <span className="font-mono text-[9px] font-bold" style={{ color: outcomeColor }}>
          {record.confidence}%
        </span>
        <span className="text-[8px] text-gray-700">{time}</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded border border-[#222] bg-[#1a1a1a] px-2.5 py-2 text-center">
      <span className="block text-[8px] uppercase tracking-widest text-gray-600 mb-0.5">
        {label}
      </span>
      <span className="font-mono text-sm font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

function WinRateBar({
  label,
  data,
}: {
  label: string
  data: { wins: number; losses: number; total: number; winRate: number }
}) {
  const color = data.winRate >= 50 ? '#22c55e' : '#ef4444'

  return (
    <div className="flex items-center justify-between rounded border border-[#222] bg-[#1a1a1a] px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-semibold text-white capitalize">{label}</span>
        <span className="text-[8px] text-gray-600">
          {data.wins}W / {data.losses}L
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-16 h-1.5 rounded-full bg-[#222] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${data.winRate}%`, backgroundColor: color }}
          />
        </div>
        <span className="font-mono text-[10px] font-bold w-10 text-right" style={{ color }}>
          {data.winRate.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}
