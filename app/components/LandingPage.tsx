'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import Navbar from './Navbar'

export interface LandingStats {
  totalSignals: number
  winRate: number
  symbols: number
  uptime: number
}

// ── Mock Signal Card ────────────────────────────────────────
function MockSignalCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: 'circOut', delay: 0.3 }}
      className="glass-card rounded-2xl p-5 w-full max-w-sm mx-auto"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide">XAUUSD</span>
            <span className="text-[10px] text-zinc-500 bg-zinc-800/60 rounded px-1.5 py-0.5">GOLD</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 tracking-wider">
            LIVE
          </span>
        </div>

        {/* BUY signal */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Signal</div>
            <div className="text-2xl font-black text-emerald-400 tracking-tight glow-buy" style={{ textShadow: '0 0 20px rgba(16,185,129,0.6)' }}>
              BUY
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Confidence</div>
            <div className="text-2xl font-black text-white">78%</div>
          </div>
        </div>

        {/* Indicators row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'RSI', value: '42', color: 'text-emerald-400' },
            { label: 'MACD', value: '+0.12', color: 'text-emerald-400' },
            { label: 'EMA', value: 'Bull', color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.03] rounded-lg p-2 text-center">
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider">{label}</div>
              <div className={`text-xs font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* TP / SL */}
        <div className="flex gap-2">
          <div className="flex-1 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg p-2 text-center">
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">TP1</div>
            <div className="text-xs font-bold text-emerald-400">$2,347.80</div>
          </div>
          <div className="flex-1 bg-rose-500/[0.06] border border-rose-500/20 rounded-lg p-2 text-center">
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">SL</div>
            <div className="text-xs font-bold text-rose-400">$2,318.50</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Features Grid ────────────────────────────────────────────
const FEATURES = [
  {
    emoji: '⚡',
    title: '6-Factor Signal Engine',
    desc: 'RSI, MACD, EMA, S/R, Bollinger Bands & Stochastic combined.',
  },
  {
    emoji: '🌐',
    title: 'Multi-Asset Coverage',
    desc: '12+ symbols across Crypto, Forex & Metals in real time.',
  },
  {
    emoji: '🤖',
    title: 'AI Commentary',
    desc: 'GPT-4o-mini explains every signal in plain, actionable English.',
  },
  {
    emoji: '📊',
    title: 'Backtesting',
    desc: 'Validate strategies against months of historical OHLCV data.',
  },
  {
    emoji: '🔔',
    title: 'Real-Time Alerts',
    desc: 'Browser push, Telegram bot & webhook notifications.',
  },
  {
    emoji: '💸',
    title: 'Paper Trading',
    desc: 'Practice risk-free with a $10,000 virtual balance.',
  },
]

function FeaturesGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {FEATURES.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.5, delay: i * 0.09 }}
          className="glass-card bg-[#0a0a0a] rounded-2xl p-5 flex flex-col gap-2"
        >
          <span className="text-2xl">{f.emoji}</span>
          <h3 className="text-sm font-bold text-white">{f.title}</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ── Animated counter ─────────────────────────────────────────
function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0)
  const startedRef = useRef(false)

  const start = () => {
    if (startedRef.current) return
    startedRef.current = true
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  return { count, start }
}

const STATS_CONFIG = [
  { label: 'Signals Tracked', suffix: '+', decimals: 0 },
  { label: 'Win Rate', suffix: '%', decimals: 0 },
  { label: 'Symbols Covered', suffix: '', decimals: 0 },
  { label: 'Uptime', suffix: '%', decimals: 1 },
]

function StatCard({ value, label, suffix, decimals }: { value: number; label: string; suffix: string; decimals: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const { count, start } = useCounter(value)

  useEffect(() => {
    if (inView) start()
  }, [inView, start])

  const display = decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()

  return (
    <div ref={ref} className="glass-card bg-[#0a0a0a] rounded-2xl p-6 text-center">
      <div className="text-3xl font-black text-white mb-1">
        <span className="text-gradient-emerald">{display}</span>
        <span className="text-emerald-400">{suffix}</span>
      </div>
      <div className="text-xs text-zinc-500 uppercase tracking-widest">{label}</div>
    </div>
  )
}

function StatsSection({ stats }: { stats: LandingStats }) {
  const values = [stats.totalSignals, stats.winRate, stats.symbols, stats.uptime]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS_CONFIG.map((cfg, i) => (
        <StatCard
          key={cfg.label}
          value={values[i]}
          label={cfg.label}
          suffix={cfg.suffix}
          decimals={cfg.decimals}
        />
      ))}
    </div>
  )
}

// ── Pricing ──────────────────────────────────────────────────
function PricingSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
      {/* Free */}
      <div className="glass-card bg-[#0a0a0a] rounded-2xl p-7 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Free</h3>
          <div className="text-3xl font-black text-white">$0<span className="text-sm text-zinc-500 font-normal">/mo</span></div>
        </div>
        <ul className="flex flex-col gap-2.5 flex-1">
          {['100 API requests/day', 'All trading signals', 'Browser notifications', 'Paper trading ($10K)', 'Signal history'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="text-emerald-500 text-xs">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/dashboard"
          className="block text-center py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors"
        >
          Get Started Free
        </Link>
      </div>

      {/* Pro */}
      <div className="glass-card bg-[#0a0a0a] rounded-2xl p-7 flex flex-col gap-4 border border-emerald-500/30"
        style={{ boxShadow: '0 0 40px rgba(16,185,129,0.08), inset 0 0 40px rgba(16,185,129,0.02)' }}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
            <div className="text-3xl font-black text-white">$9<span className="text-sm text-zinc-500 font-normal">/mo</span></div>
          </div>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2.5 py-1 tracking-wider">
            COMING SOON
          </span>
        </div>
        <ul className="flex flex-col gap-2.5 flex-1">
          {['Unlimited API requests', 'Webhook integrations', 'Priority support', 'Advanced backtesting', 'Custom alert rules'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="text-emerald-500 text-xs">✓</span>
              {item}
            </li>
          ))}
        </ul>
        <button
          disabled
          className="block w-full text-center py-2.5 rounded-xl bg-zinc-800 text-zinc-500 font-semibold text-sm cursor-not-allowed"
        >
          Coming Soon
        </button>
      </div>
    </div>
  )
}

// ── Landing Footer ───────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.04] mt-20 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Demo', href: '/demo' },
            { label: 'Leaderboard', href: '/leaderboard' },
            { label: 'Feed', href: '/feed' },
            { label: 'API Docs', href: '/api-keys' },
            { label: 'GitHub', href: 'https://github.com/naimkatiman/alpha-scanner' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="text-center text-xs text-zinc-600">
          Built with ❤️ by Alpha Scanner
        </p>
        <p className="text-center text-xs text-zinc-700 mt-1">
          &copy; 2026 Alpha Scanner. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

// ── Root Landing Page ────────────────────────────────────────
export default function LandingPage({ stats }: { stats: LandingStats }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#050505] overflow-x-hidden relative">
      <div className="ambient-glow" />
      <Navbar onMenuToggle={() => {}} />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 md:pt-28 md:pb-24 gap-8">
          {/* Radial glow behind hero */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 70%)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'circOut' }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            {/* Badge */}
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 tracking-wider uppercase">
              Real-Time · Multi-Asset · AI-Powered
            </span>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight text-white max-w-3xl">
              <span className="text-gradient-emerald">AI-Powered</span>{' '}
              Trading Signals
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
              Real-time technical analysis across{' '}
              <span className="text-zinc-200">Crypto, Forex &amp; Metals</span>
              {' '}— powered by a{' '}
              <span className="text-emerald-400">6-factor signal engine</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                Launch Dashboard
              </Link>
              <Link
                href="/demo"
                className="px-6 py-3 rounded-xl border border-emerald-500/30 text-emerald-400 font-bold text-sm transition-all hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:scale-[1.03] active:scale-[0.98]"
              >
                Try Demo
              </Link>
            </div>
          </motion.div>

          {/* Mock signal card */}
          <div className="relative z-10 w-full max-w-sm">
            <MockSignalCard />
          </div>
        </section>

        {/* ── Features ── */}
        <section className="px-4 py-16 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Everything you need to trade smarter
            </h2>
            <p className="text-sm text-zinc-500">No noise. No hype. Just signals.</p>
          </motion.div>
          <FeaturesGrid />
        </section>

        {/* ── Live Stats ── */}
        <section className="px-4 py-16 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Proven performance
            </h2>
            <p className="text-sm text-zinc-500">Numbers pulled live from our signal database.</p>
          </motion.div>
          <StatsSection stats={stats} />
        </section>

        {/* ── Pricing ── */}
        <section className="px-4 py-16 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Simple pricing
            </h2>
            <p className="text-sm text-zinc-500">Start free. Upgrade when you&apos;re ready.</p>
          </motion.div>
          <PricingSection />
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
