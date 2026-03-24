'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  TrendUp,
  TrendDown,
  Minus,
  ArrowRight,
  Shield,
  Crosshair,
  Lightning,
  ChartBar,
  WarningCircle,
} from '@phosphor-icons/react'

const DEMO_SIGNALS = [
  {
    symbol: 'XAUUSD',
    name: 'Gold / USD',
    direction: 'BUY' as const,
    confidence: 87,
    entryPrice: 2920.5,
    stopLoss: 2909.0,
    tp1: 2929.1,
    tp2: 2938.7,
    tp3: 2950.2,
    technicals: { rsi: true, macd: true, ema: true, sr: false },
    rsiValue: '62',
    macdValue: '+0.45',
    emaStatus: 'Above EMA50',
    commentary:
      'Strong uptrend continuation confirmed by RSI recovery to 62. MACD bullish crossover above zero line with expanding histogram. Price holding above EMA20/50 confluence zone. Primary target at $2,938 resistance.',
    timestamp: '2 min ago',
  },
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / USD',
    direction: 'SELL' as const,
    confidence: 72,
    entryPrice: 84000,
    stopLoss: 85680,
    tp1: 82500,
    tp2: 80100,
    tp3: 76500,
    technicals: { rsi: true, macd: false, ema: true, sr: true },
    rsiValue: '71',
    macdValue: '-120',
    emaStatus: 'Below EMA20',
    commentary:
      'Failed breakout at $85K key resistance. RSI showing bearish divergence at 71 on 1H timeframe. Bearish engulfing candle with above-average volume. Watch $82,500 as first major support target.',
    timestamp: '6 min ago',
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / USD',
    direction: 'NEUTRAL' as const,
    confidence: 45,
    entryPrice: 1.085,
    stopLoss: 0,
    tp1: 0,
    tp2: 0,
    tp3: 0,
    technicals: { rsi: false, macd: false, ema: true, sr: true },
    rsiValue: '51',
    macdValue: '-0.002',
    emaStatus: 'At EMA50',
    commentary:
      'Mixed signals with price consolidating near EMA50. RSI at 51 — neither overbought nor oversold. MACD near zero with no clear momentum bias. Wait for breakout above 1.0900 or breakdown below 1.0800.',
    timestamp: '11 min ago',
  },
]

const DIR_CFG = {
  BUY: {
    Icon: TrendUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_24px_rgba(16,185,129,0.12)]',
    bar: 'bg-emerald-500',
  },
  SELL: {
    Icon: TrendDown,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    glow: 'shadow-[0_0_24px_rgba(244,63,94,0.12)]',
    bar: 'bg-rose-500',
  },
  NEUTRAL: {
    Icon: Minus,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
    glow: '',
    bar: 'bg-zinc-500',
  },
}

function fmt(symbol: string, price: number): string {
  if (price === 0) return '—'
  if (symbol === 'XAUUSD' || symbol === 'XAGUSD') return price.toFixed(2)
  if (symbol === 'BTCUSD' || symbol === 'ETHUSD')
    return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (symbol === 'USDJPY') return price.toFixed(3)
  return price.toFixed(4)
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/4 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/[0.03] blur-3xl" />
      </div>

      {/* Demo banner */}
      <div className="relative z-10 border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm" aria-hidden="true">🎮</span>
            <span className="text-xs font-medium text-zinc-300">
              Demo Mode — Signals are simulated
            </span>
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              DEMO
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-[11px] font-semibold text-black transition-all hover:bg-emerald-400 active:scale-95"
          >
            Go to Live Dashboard
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1"
          >
            <Lightning size={12} className="text-emerald-500" aria-hidden="true" />
            <span className="text-[11px] font-semibold tracking-wider text-emerald-400">
              ALPHA SCANNER — DEMO
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="mb-2 text-2xl font-bold text-white sm:text-3xl"
          >
            Live-Like Signals. Zero Risk.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="mx-auto max-w-md text-sm text-zinc-500"
          >
            Explore the full dashboard experience with simulated signals for Gold,
            Bitcoin, and EUR/USD — no account needed.
          </motion.p>
        </div>

        {/* Signal cards */}
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          {DEMO_SIGNALS.map((signal, i) => {
            const cfg = DIR_CFG[signal.direction]
            const { Icon } = cfg
            return (
              <motion.div
                key={signal.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`glass-panel rounded-2xl border p-5 ${cfg.border} ${cfg.glow}`}
              >
                {/* Symbol header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="mb-0.5 font-mono text-[10px] text-zinc-600">
                      {signal.name}
                    </div>
                    <div className="text-base font-bold text-white">{signal.symbol}</div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${cfg.bg} ${cfg.border}`}
                  >
                    <Icon size={12} className={cfg.color} aria-hidden="true" />
                    <span className={`text-xs font-bold ${cfg.color}`}>
                      {signal.direction}
                    </span>
                  </div>
                </div>

                {/* Confidence */}
                <div className="mb-4">
                  <div className="mb-1.5 flex justify-between text-[10px]">
                    <span className="uppercase tracking-widest text-zinc-500">Confidence</span>
                    <span className={`font-mono font-bold ${cfg.color}`}>
                      {signal.confidence}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className={`h-full rounded-full ${cfg.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${signal.confidence}%` }}
                      transition={{
                        duration: 0.9,
                        delay: 0.35 + i * 0.1,
                        type: 'spring',
                        stiffness: 60,
                      }}
                    />
                  </div>
                </div>

                {/* Entry price */}
                <div className="mb-4 rounded-lg bg-white/[0.03] px-3 py-2.5">
                  <div className="mb-1 text-[10px] text-zinc-600">Entry Price</div>
                  <div className="font-mono text-lg font-bold text-white">
                    {fmt(signal.symbol, signal.entryPrice)}
                  </div>
                  <div className="mt-0.5 text-[10px] text-zinc-600">{signal.timestamp}</div>
                </div>

                {/* TP / SL */}
                {signal.direction !== 'NEUTRAL' ? (
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-rose-500/10 bg-rose-500/5 px-2.5 py-2">
                      <div className="mb-0.5 flex items-center gap-1 text-[9px] text-zinc-600">
                        <Shield size={9} className="text-rose-400" aria-hidden="true" />
                        SL
                      </div>
                      <div className="font-mono text-xs text-rose-400">
                        {fmt(signal.symbol, signal.stopLoss)}
                      </div>
                    </div>
                    {[
                      { label: 'TP1', val: signal.tp1 },
                      { label: 'TP2', val: signal.tp2 },
                      { label: 'TP3', val: signal.tp3 },
                    ].map(({ label, val }) => (
                      <div
                        key={label}
                        className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-2"
                      >
                        <div className="mb-0.5 flex items-center gap-1 text-[9px] text-zinc-600">
                          <Crosshair size={9} className="text-emerald-400" aria-hidden="true" />
                          {label}
                        </div>
                        <div className="font-mono text-xs text-emerald-400">
                          {fmt(signal.symbol, val)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4 rounded-lg border border-zinc-500/10 bg-zinc-500/5 px-3 py-2.5 text-center">
                    <div className="text-[11px] text-zinc-500">
                      Awaiting clear breakout direction
                    </div>
                  </div>
                )}

                {/* Technical indicators */}
                <div className="mb-4">
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">
                    Indicators
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'RSI', active: signal.technicals.rsi, value: signal.rsiValue },
                      { name: 'MACD', active: signal.technicals.macd, value: signal.macdValue },
                      { name: 'EMA', active: signal.technicals.ema, value: signal.emaStatus },
                      { name: 'S/R', active: signal.technicals.sr },
                    ].map((ind) => (
                      <div
                        key={ind.name}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                          ind.active
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                            : 'border-white/[0.06] bg-white/[0.03] text-zinc-600'
                        }`}
                      >
                        {ind.name}
                        {ind.active && ind.value && (
                          <span className="ml-1 text-[9px] opacity-70">{ind.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI commentary */}
                <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <ChartBar size={10} className="text-emerald-500" aria-hidden="true" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-400">
                      AI Commentary
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-400">
                    {signal.commentary}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="rounded-2xl border border-emerald-500/20 glass-panel p-6 text-center"
        >
          <div className="mb-2 flex items-center justify-center gap-2">
            <WarningCircle size={14} className="text-amber-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-zinc-400">
              Demo signals are for exploration only — not financial advice
            </span>
          </div>
          <p className="mb-4 text-sm text-zinc-500">
            Ready to access live signals updated every 30 seconds with real market data?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-400 active:scale-95"
            >
              Go to Live Dashboard
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
            >
              Create Free Account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
