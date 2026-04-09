'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import Navbar from './Navbar'
import {
  Lightning,
  ChartBar,
  Bell,
  Target,
  ArrowRight,
  GithubLogo,
  CheckCircle,
} from '@phosphor-icons/react'

export interface LandingStats {
  totalSignals: number
  winRate: number
  symbols: number
  uptime: number
}

function MockSignalCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: 'circOut', delay: 0.3 }}
      className="glass-card rounded-2xl p-5 w-full max-w-sm"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide">
              XAUUSD
            </span>
            <span className="text-[10px] text-zinc-500 bg-zinc-800/60 rounded px-1.5 py-0.5">
              GOLD
            </span>
          </div>
          <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5 tracking-wider">
            LIVE
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">
              Signal
            </div>
            <div
              className="text-2xl font-black text-blue-400 tracking-tight"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              BUY
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">
              Confidence
            </div>
            <div
              className="text-2xl font-black text-white"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              78%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'RSI', value: '42' },
            { label: 'MACD', value: '+0.12' },
            { label: 'EMA', value: 'Bull' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-white/[0.03] rounded-lg p-2 text-center"
            >
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider">
                {label}
              </div>
              <div
                className="text-xs font-bold text-blue-400"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-blue-500/[0.06] border border-blue-500/20 rounded-lg p-2 text-center">
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">
              TP1
            </div>
            <div
              className="text-xs font-bold text-blue-400"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              $2,347.80
            </div>
          </div>
          <div className="flex-1 bg-rose-500/[0.06] border border-rose-500/20 rounded-lg p-2 text-center">
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">
              SL
            </div>
            <div
              className="text-xs font-bold text-rose-400"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              $2,318.50
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

const FEATURES = [
  {
    icon: Lightning,
    title: 'Multi-asset signal engine',
    desc: 'RSI, MACD, EMA, Bollinger Bands, Stochastic, and support/resistance across 12+ instruments. Updated every 30 seconds.',
  },
  {
    icon: Target,
    title: 'Fibonacci TP/SL',
    desc: 'Automated take-profit and stop-loss levels derived from Fibonacci retracements on every active signal.',
  },
  {
    icon: ChartBar,
    title: 'Backtesting engine',
    desc: 'Validate any strategy against months of historical OHLCV data. See win rate, profit factor, and drawdown in seconds.',
  },
  {
    icon: Bell,
    title: 'Telegram alerts',
    desc: 'Real-time push to Telegram the moment a signal fires. Browser push and webhook delivery also available.',
  },
]

function FeaturesGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {FEATURES.map((f, i) => {
        const Icon = f.icon
        return (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={{ duration: 0.5, delay: i * 0.09 }}
            className={`glass-card bg-[#0a0a0a] rounded-2xl p-6 flex flex-col gap-2.5 ${
              i % 2 === 1 ? 'md:translate-y-4' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-1">
              <Icon className="w-5 h-5 text-blue-400" weight="duotone" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {f.title}
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
          </motion.div>
        )
      })}
    </div>
  )
}

const SPEC_STATS = [
  { value: '12', label: 'Instruments', suffix: '' },
  { value: '30s', label: 'Refresh', suffix: '' },
  { value: '6', label: 'Indicators', suffix: '' },
  { value: '3', label: 'Timeframes', suffix: '' },
]

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {SPEC_STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
          className="glass-card bg-[#0a0a0a] rounded-2xl p-6"
        >
          <div
            className="text-4xl font-black text-white mb-1 tracking-tighter"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            <span className="text-gradient-emerald">{stat.value}</span>
          </div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function PricingSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
      <div className="glass-card bg-[#0a0a0a] rounded-2xl p-7 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1 tracking-tight">
            Free
          </h3>
          <div
            className="text-3xl font-black text-white"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            $0
            <span className="text-sm text-zinc-500 font-normal">/mo</span>
          </div>
        </div>
        <ul className="flex flex-col gap-2.5 flex-1">
          {[
            '100 API requests/day',
            'All trading signals',
            'Browser notifications',
            'Paper trading ($10K)',
            'Signal history',
          ].map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-sm text-zinc-400"
            >
              <CheckCircle
                className="w-3.5 h-3.5 text-blue-400 flex-shrink-0"
                weight="fill"
              />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-1.5 text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-200"
        >
          Get started free
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div
        className="glass-card bg-[#0a0a0a] rounded-2xl p-7 flex flex-col gap-4 border border-blue-500/30"
        style={{
          boxShadow:
            '0 0 40px rgba(37,99,235,0.08), inset 0 0 40px rgba(37,99,235,0.02)',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 tracking-tight">
              Pro
            </h3>
            <div
              className="text-3xl font-black text-white"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              $29
              <span className="text-sm text-zinc-500 font-normal">/mo</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-2.5 py-1 tracking-wider">
            POPULAR
          </span>
        </div>
        <ul className="flex flex-col gap-2.5 flex-1">
          {[
            'Unlimited API requests',
            'All 12+ assets',
            'Webhook & Telegram alerts',
            'Advanced backtesting',
            'Custom alert rules',
          ].map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-sm text-zinc-400"
            >
              <CheckCircle
                className="w-3.5 h-3.5 text-blue-400 flex-shrink-0"
                weight="fill"
              />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-1.5 text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-200"
        >
          View plans
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.04] mt-20 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 mb-6">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Demo', href: '/demo' },
              { label: 'Leaderboard', href: '/leaderboard' },
              { label: 'Feed', href: '/feed' },
              { label: 'API Keys', href: '/api-keys' },
              {
                label: 'GitHub',
                href: 'https://github.com/naimkatiman/alpha-scanner',
              },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                {...(href.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex gap-x-4 text-xs text-zinc-600">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Not financial advice</span>
          </div>
        </div>
        <p className="text-left text-xs text-zinc-600">
          Built by Alpha Scanner · &copy; 2026 All rights reserved
        </p>
      </div>
    </footer>
  )
}

export default function LandingPage({ stats }: { stats: LandingStats }) {
  // Reserved — stats is still accepted for backwards compat from server fetch
  void stats
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505] overflow-x-hidden relative">
      <div className="ambient-glow" />
      <Navbar onMenuToggle={() => {}} />

      <main className="flex-1">
        {/* Hero — Asymmetric split */}
        <section className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-24 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 items-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'circOut' }}
            className="relative z-10 flex flex-col gap-5"
          >
            <span className="self-start text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 tracking-wider uppercase">
              Forex · Crypto · Metals · Indices
            </span>

            <h1
              className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tighter text-white"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              Professional signals for{' '}
              <span className="text-gradient-emerald">serious traders.</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
              RSI, MACD, EMA, Bollinger, and Fibonacci TP/SL on XAUUSD, BTC,
              ETH, and 10 more instruments. Updated every 30 seconds.
            </p>

            <p className="text-xs text-zinc-600">
              Powered by TradeClaw — the open-source trading engine
            </p>

            <div className="flex flex-wrap gap-3 mt-1">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm transition-all duration-200"
              >
                <Lightning className="w-4 h-4" weight="fill" />
                View signals
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="https://github.com/naimkatiman/alpha-scanner"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-blue-500/30 text-blue-400 font-bold text-sm transition-all duration-200 hover:bg-blue-500/10 hover:border-blue-500/50 active:scale-[0.98]"
              >
                <GithubLogo className="w-4 h-4" weight="bold" />
                View on GitHub
              </Link>
            </div>
          </motion.div>

          <div className="relative z-10 flex justify-center lg:justify-end">
            <MockSignalCard />
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 py-16 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tighter">
              Built for speed
            </h2>
            <p className="text-sm text-zinc-500">
              Every number tuned for institutional-grade scanning.
            </p>
          </motion.div>
          <StatsSection />
        </section>

        {/* Features — 2-col asymmetric */}
        <section className="px-4 py-16 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tighter">
              Everything you need to trade smarter
            </h2>
            <p className="text-sm text-zinc-500">
              No noise. No hype. Just signals.
            </p>
          </motion.div>
          <FeaturesGrid />
        </section>

        {/* Pricing */}
        <section className="px-4 py-16 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tighter">
              Simple pricing
            </h2>
            <p className="text-sm text-zinc-500">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </motion.div>
          <PricingSection />
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
