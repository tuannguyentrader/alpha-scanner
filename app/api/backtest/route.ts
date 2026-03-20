import { NextResponse } from 'next/server'
import { fetchHistory } from '@/app/api/history/route'
import { runBacktest, type BacktestResult } from '@/app/lib/backtestEngine'
import { checkRateLimit } from '@/app/lib/apiGuard'
import { getAllSymbols } from '@/app/lib/symbols'
import type { TradingMode, RiskProfile } from '@/app/data/mockSignals'

/* ── Cache ─────────────────────────────────────────────────────────────────── */

const backtestCache = new Map<string, { data: BacktestResult; expiresAt: number }>()
const CACHE_TTL = 5 * 60_000 // 5 minutes

const VALID_SYMBOLS = getAllSymbols().map((s) => s.symbol)
const VALID_MODES: TradingMode[] = ['swing', 'intraday', 'scalper']
const VALID_RISKS: RiskProfile[] = ['conservative', 'balanced', 'high-risk']

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function GET(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase()
  const mode = searchParams.get('mode')?.toLowerCase() as TradingMode | undefined
  const risk = searchParams.get('risk')?.toLowerCase() as RiskProfile | undefined

  if (!symbol || !VALID_SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
  }
  if (!mode || !VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }
  if (!risk || !VALID_RISKS.includes(risk)) {
    return NextResponse.json({ error: 'Invalid risk' }, { status: 400 })
  }

  const cacheKey = `${symbol}:${mode}:${risk}`
  const now = Date.now()
  const cached = backtestCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data)
  }

  try {
    const { candles } = await fetchHistory(symbol)
    const result = runBacktest(candles, symbol, mode, risk)

    backtestCache.set(cacheKey, { data: result, expiresAt: now + CACHE_TTL })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
