'use client'

import { useState } from 'react'
import { useIndicators } from '../hooks/useIndicators'
import { fmt } from '../data/mockSignals'
import type { AllIndicators } from '../lib/technicalAnalysis'

interface IndicatorsPanelProps {
  symbol: string
}

/* ── Badge helper ─────────────────────────────────────────────────────────── */

type Sentiment = 'bullish' | 'bearish' | 'neutral'

function Badge({ sentiment }: { sentiment: Sentiment }) {
  const styles: Record<Sentiment, { bg: string; text: string; label: string }> = {
    bullish: { bg: '#14b8a618', text: '#14b8a6', label: 'Bullish' },
    bearish: { bg: '#ef444418', text: '#ef4444', label: 'Bearish' },
    neutral: { bg: '#6b728018', text: '#9ca3af', label: 'Neutral' },
  }
  const s = styles[sentiment]
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

/* ── RSI Gauge ────────────────────────────────────────────────────────────── */

function RSIGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  const color = clamped < 30 ? '#14b8a6' : clamped > 70 ? '#ef4444' : '#6b7280'
  const sentiment: Sentiment = clamped < 30 ? 'bullish' : clamped > 70 ? 'bearish' : 'neutral'
  const label = clamped < 30 ? 'Oversold' : clamped > 70 ? 'Overbought' : 'Neutral'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-300">RSI</span>
          <span className="text-[10px] text-gray-600">14-period</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600">{label}</span>
          <Badge sentiment={sentiment} />
        </div>
      </div>

      {/* Bar track */}
      <div className="relative h-3 rounded-full bg-[#1a1a1a] overflow-hidden">
        {/* Zones */}
        <div className="absolute inset-0 flex">
          <div className="h-full" style={{ width: '30%', backgroundColor: '#14b8a610' }} />
          <div className="h-full" style={{ width: '40%', backgroundColor: '#6b728010' }} />
          <div className="h-full flex-1" style={{ backgroundColor: '#ef444410' }} />
        </div>
        {/* Zone dividers */}
        <div className="absolute inset-y-0" style={{ left: '30%', width: '1px', backgroundColor: '#333' }} />
        <div className="absolute inset-y-0" style={{ left: '70%', width: '1px', backgroundColor: '#333' }} />
        {/* Indicator needle */}
        <div
          className="absolute top-0 h-full w-1 rounded-full transition-all duration-700"
          style={{ left: `calc(${clamped}% - 2px)`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[9px] text-gray-700">
        <span>0</span>
        <span className="text-[#14b8a6]">30</span>
        <span>50</span>
        <span className="text-[#ef4444]">70</span>
        <span>100</span>
      </div>

      {/* Numeric value */}
      <div className="text-right">
        <span className="font-mono text-xl font-bold" style={{ color }}>
          {clamped.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

/* ── MACD Display ─────────────────────────────────────────────────────────── */

function MACDDisplay({
  macd,
}: {
  macd: AllIndicators['macd']
}) {
  const { macdLine, signalLine, histogram } = macd
  const isBullish = macdLine > signalLine
  const histColor = histogram > 0 ? '#14b8a6' : '#ef4444'
  const sentiment: Sentiment = isBullish ? 'bullish' : 'bearish'
  const crossoverLabel = isBullish ? 'Bullish Crossover' : 'Bearish Crossover'

  const fmt6 = (v: number) => {
    if (!isFinite(v)) return 'N/A'
    const abs = Math.abs(v)
    if (abs >= 1000) return v.toFixed(0)
    if (abs >= 100) return v.toFixed(1)
    if (abs >= 10) return v.toFixed(2)
    if (abs >= 1) return v.toFixed(3)
    return v.toFixed(5)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-300">MACD</span>
          <span className="text-[10px] text-gray-600">12 / 26 / 9</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{crossoverLabel}</span>
          <Badge sentiment={sentiment} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* MACD Line */}
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">MACD</div>
          <div
            className="font-mono text-sm font-bold"
            style={{ color: macdLine >= 0 ? '#14b8a6' : '#ef4444' }}
          >
            {fmt6(macdLine)}
          </div>
        </div>

        {/* Signal Line */}
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Signal</div>
          <div className="font-mono text-sm font-bold text-gray-300">{fmt6(signalLine)}</div>
        </div>

        {/* Histogram */}
        <div className="rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2 text-center">
          <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Hist</div>
          <div className="font-mono text-sm font-bold" style={{ color: histColor }}>
            {fmt6(histogram)}
          </div>
        </div>
      </div>

      {/* Histogram bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.abs(histogram / (Math.abs(macdLine) || 1)) * 50 + 50)}%`,
              backgroundColor: histColor,
              opacity: 0.7,
            }}
          />
        </div>
        <span className="text-[9px] text-gray-600 flex-shrink-0">
          {histogram > 0 ? '▲' : '▼'} momentum
        </span>
      </div>
    </div>
  )
}

/* ── EMA Display ──────────────────────────────────────────────────────────── */

function EMADisplay({
  symbol,
  currentPrice,
  ema20,
  ema50,
  ema200,
}: {
  symbol: string
  currentPrice: number
  ema20: number
  ema50: number
  ema200: number
}) {
  const bullishAlignment =
    isFinite(currentPrice) &&
    isFinite(ema20) &&
    isFinite(ema50) &&
    isFinite(ema200) &&
    currentPrice > ema20 &&
    ema20 > ema50 &&
    ema50 > ema200

  const bearishAlignment =
    isFinite(currentPrice) &&
    isFinite(ema20) &&
    isFinite(ema50) &&
    isFinite(ema200) &&
    currentPrice < ema20 &&
    ema20 < ema50 &&
    ema50 < ema200

  const alignmentSentiment: Sentiment = bullishAlignment
    ? 'bullish'
    : bearishAlignment
    ? 'bearish'
    : 'neutral'

  const alignmentLabel = bullishAlignment
    ? 'Bullish Alignment'
    : bearishAlignment
    ? 'Bearish Alignment'
    : 'Mixed Alignment'

  const emaRows: { label: string; value: number; abovePrice: boolean }[] = [
    { label: 'EMA 20', value: ema20, abovePrice: isFinite(ema20) && ema20 > currentPrice },
    { label: 'EMA 50', value: ema50, abovePrice: isFinite(ema50) && ema50 > currentPrice },
    { label: 'EMA 200', value: ema200, abovePrice: isFinite(ema200) && ema200 > currentPrice },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-300">EMA</span>
          <span className="text-[10px] text-gray-600">20 / 50 / 200</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{alignmentLabel}</span>
          <Badge sentiment={alignmentSentiment} />
        </div>
      </div>

      <div className="space-y-1.5">
        {emaRows.map(({ label, value, abovePrice }) => {
          const positionColor = abovePrice ? '#ef4444' : '#14b8a6'
          const positionLabel = abovePrice ? 'above price' : 'below price'
          return (
            <div
              key={label}
              className="flex items-center justify-between rounded-md border border-[#222] bg-[#0f0f0f] px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: positionColor }}
                  aria-hidden="true"
                />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isFinite(value) ? (
                  <>
                    <span className="text-[9px] text-gray-600">{positionLabel}</span>
                    <span className="font-mono text-xs font-bold text-gray-200">
                      {fmt(symbol, value)}
                    </span>
                  </>
                ) : (
                  <span className="text-[9px] text-gray-700">Insufficient data</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Current price reference */}
      <div className="flex items-center gap-2 border-t border-[#222] pt-2">
        <span className="text-[10px] uppercase tracking-widest text-gray-600">Current</span>
        <span className="font-mono text-sm font-bold text-white">{fmt(symbol, currentPrice)}</span>
        {bullishAlignment && (
          <span className="text-[10px] text-[#14b8a6]">· price above all EMAs ↑</span>
        )}
        {bearishAlignment && (
          <span className="text-[10px] text-[#ef4444]">· price below all EMAs ↓</span>
        )}
      </div>
    </div>
  )
}

/* ── Shimmer skeleton ─────────────────────────────────────────────────────── */

function SkeletonRow() {
  return <div className="h-10 rounded-md bg-[#1a1a1a] animate-pulse" />
}

/* ── Main component ───────────────────────────────────────────────────────── */

export default function IndicatorsPanel({ symbol }: IndicatorsPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { indicators, loading, error } = useIndicators(symbol)

  return (
    <div
      className="rounded-lg border border-[#222] bg-[#111]"
      style={{ borderTopColor: '#3b82f6', borderTopWidth: '2px' }}
    >
      {/* Collapsible header */}
      <button
        className="flex w-full items-center justify-between px-4 py-3 sm:px-5 sm:py-4 hover:bg-[#1a1a1a] transition-colors rounded-t-lg"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-white">Technical Indicators</h3>
          <span className="hidden sm:inline text-xs text-gray-600">
            · {symbol} · RSI · MACD · EMA
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`text-gray-600 flex-shrink-0 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-[#222] px-4 pb-4 sm:px-5 sm:pb-5">
          {/* Loading shimmer */}
          {loading && (
            <div className="flex flex-col gap-3 pt-4">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="mt-4 rounded-md border border-[#333] bg-[#1a1a1a] px-3 py-3 text-xs text-gray-500">
              Unable to load indicators · {error}
            </div>
          )}

          {/* Data */}
          {!loading && !error && indicators && (
            <div className="mt-4 space-y-5">
              {/* RSI */}
              <div className="rounded-md border border-[#222] bg-[#0a0a0a] px-3 py-3 sm:px-4 sm:py-4">
                {isFinite(indicators.rsi) ? (
                  <RSIGauge value={indicators.rsi} />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-300">RSI</span>
                      <Badge sentiment="neutral" />
                    </div>
                    <p className="text-[10px] text-gray-600">Insufficient price history</p>
                  </div>
                )}
              </div>

              {/* MACD */}
              <div className="rounded-md border border-[#222] bg-[#0a0a0a] px-3 py-3 sm:px-4 sm:py-4">
                {isFinite(indicators.macd.macdLine) ? (
                  <MACDDisplay macd={indicators.macd} />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-300">MACD</span>
                      <Badge sentiment="neutral" />
                    </div>
                    <p className="text-[10px] text-gray-600">Insufficient price history</p>
                  </div>
                )}
              </div>

              {/* EMA */}
              <div className="rounded-md border border-[#222] bg-[#0a0a0a] px-3 py-3 sm:px-4 sm:py-4">
                <EMADisplay
                  symbol={symbol}
                  currentPrice={indicators.currentPrice}
                  ema20={indicators.ema20}
                  ema50={indicators.ema50}
                  ema200={indicators.ema200}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
