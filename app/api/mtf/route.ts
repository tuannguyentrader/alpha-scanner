import { NextResponse } from 'next/server'
import { fetchHistory } from '@/app/api/history/route'
import { computeAllIndicators } from '@/app/lib/technicalAnalysis'
import { generateSignal, type SignalDirection } from '@/app/lib/signalEngine'
import { computeSR } from '@/app/lib/supportResistance'
import { getAllSymbols, getSymbolConfig } from '@/app/lib/symbols'
import { checkRateLimit } from '@/app/lib/apiGuard'
import type { Candle } from '@/app/lib/supportResistance'

/* ── Types ────────────────────────────────────────────────────────────────── */

export type Timeframe = 'M15' | 'H1' | 'H4' | 'D1'

export interface TimeframeSignal {
  timeframe: Timeframe
  direction: SignalDirection
  confidence: number
  rsi: number
  macdHistogram: number
  emaAlignment: 'bullish' | 'bearish' | 'neutral'
}

export interface MTFResponse {
  symbol: string
  timeframes: TimeframeSignal[]
  confluence: {
    direction: SignalDirection
    score: number // 0-100
    agreeing: number
    total: number
  }
}

/* ── Cache ─────────────────────────────────────────────────────────────────── */

const mtfCache = new Map<string, { data: MTFResponse; expiresAt: number }>()
const CACHE_TTL = 60_000

const VALID_SYMBOLS = getAllSymbols().map((s) => s.symbol)

/* ── Resample candles to timeframe ────────────────────────────────────────── */

function resampleCandles(candles: Candle[], intervalMs: number): Candle[] {
  if (candles.length === 0) return []

  const buckets = new Map<number, Candle[]>()
  for (const c of candles) {
    const bucketTime = Math.floor(c.time / intervalMs) * intervalMs
    if (!buckets.has(bucketTime)) buckets.set(bucketTime, [])
    buckets.get(bucketTime)!.push(c)
  }

  const result: Candle[] = []
  const sortedKeys = [...buckets.keys()].sort((a, b) => a - b)
  for (const key of sortedKeys) {
    const group = buckets.get(key)!
    result.push({
      time: key,
      open: group[0].open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: group[group.length - 1].close,
    })
  }
  return result
}

/* ── Timeframe intervals ──────────────────────────────────────────────────── */

const TF_INTERVALS: Record<Timeframe, number> = {
  M15: 15 * 60 * 1000,
  H1: 60 * 60 * 1000,
  H4: 4 * 60 * 60 * 1000,
  D1: 24 * 60 * 60 * 1000,
}

/* ── Compute MTF ──────────────────────────────────────────────────────────── */

async function computeMTF(symbol: string): Promise<MTFResponse> {
  const now = Date.now()
  const cached = mtfCache.get(symbol)
  if (cached && cached.expiresAt > now) return cached.data

  const { candles: rawCandles } = await fetchHistory(symbol)
  const cfg = getSymbolConfig(symbol)

  const timeframes: Timeframe[] = ['M15', 'H1', 'H4', 'D1']
  const results: TimeframeSignal[] = []

  for (const tf of timeframes) {
    const resampled = tf === 'D1' ? rawCandles : resampleCandles(rawCandles, TF_INTERVALS[tf])

    if (resampled.length < 5) {
      results.push({
        timeframe: tf,
        direction: 'NEUTRAL',
        confidence: 35,
        rsi: NaN,
        macdHistogram: NaN,
        emaAlignment: 'neutral',
      })
      continue
    }

    const indicators = computeAllIndicators(resampled)
    const currentPrice = indicators.currentPrice
    const { support, resistance } = computeSR(resampled, currentPrice)

    const signal = generateSignal({
      indicators,
      support,
      resistance,
      symbol,
      mode: 'intraday', // standard baseline
      risk: 'balanced',
    })

    // EMA alignment
    let emaAlignment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    if (
      isFinite(indicators.ema20) &&
      isFinite(indicators.ema50) &&
      currentPrice > indicators.ema20 &&
      indicators.ema20 > indicators.ema50
    ) {
      emaAlignment = 'bullish'
    } else if (
      isFinite(indicators.ema20) &&
      isFinite(indicators.ema50) &&
      currentPrice < indicators.ema20 &&
      indicators.ema20 < indicators.ema50
    ) {
      emaAlignment = 'bearish'
    }

    results.push({
      timeframe: tf,
      direction: signal.direction,
      confidence: signal.confidence,
      rsi: indicators.rsi,
      macdHistogram: indicators.macd.histogram,
      emaAlignment,
    })
  }

  // Compute confluence
  const buyCount = results.filter((r) => r.direction === 'BUY').length
  const sellCount = results.filter((r) => r.direction === 'SELL').length
  const total = results.length

  let confluenceDir: SignalDirection = 'NEUTRAL'
  let agreeing = 0
  if (buyCount > sellCount && buyCount >= 2) {
    confluenceDir = 'BUY'
    agreeing = buyCount
  } else if (sellCount > buyCount && sellCount >= 2) {
    confluenceDir = 'SELL'
    agreeing = sellCount
  } else {
    agreeing = Math.max(buyCount, sellCount)
  }

  const score = Math.round((agreeing / total) * 100)

  const data: MTFResponse = {
    symbol,
    timeframes: results,
    confluence: {
      direction: confluenceDir,
      score,
      agreeing,
      total,
    },
  }

  mtfCache.set(symbol, { data, expiresAt: now + CACHE_TTL })
  return data
}

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function GET(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase()

  if (!symbol || !VALID_SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
  }

  try {
    const data = await computeMTF(symbol)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
