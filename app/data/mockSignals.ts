/* ── Shared types ────────────────────────────────────────────────────────────── */

export type TradingMode = 'swing' | 'intraday' | 'scalper'
export type RiskProfile = 'conservative' | 'balanced' | 'high-risk'

export interface SignalData {
  direction: 'BUY' | 'SELL' | 'NEUTRAL' | 'NEUTRAL'
  confidence: number
  entryPrice: number
  stopLoss: number
  tp1: number
  tp2: number
  tp3: number
  timestamp: string
  technicals: {
    rsi: boolean
    macd: boolean
    ema: boolean
    sr: boolean
  }
  reason: string
}

/* ── Re-exports from centralized registry (backward compat) ──────────────── */

export { getPipSize, fmt, fmtPips, getBasePrice } from '../lib/symbols'

/* ── Base prices (all 12 symbols) ───────────────────────────────────────────── */

export const BASE_PRICES: Record<string, number> = {
  XAUUSD: 2920,
  XAGUSD: 32.5,
  BTCUSD: 84000,
  ETHUSD: 1920,
  XRPUSD: 2.35,
  SOLUSD: 145,
  DOGEUSD: 0.17,
  ADAUSD: 0.72,
  EURUSD: 1.085,
  GBPUSD: 1.265,
  USDJPY: 149.5,
  AUDUSD: 0.652,
}

/* ── Position sizing helper ──────────────────────────────────────────────────── */

import { getPipSize as _getPipSize } from '../lib/symbols'

export function pipValue(symbol: string, capital: number, leverage: number): string {
  const pip = _getPipSize(symbol)
  const price = BASE_PRICES[symbol] ?? 100
  const lotValue = (capital * leverage) / price
  const val = lotValue * pip
  if (val >= 1) return `$${val.toFixed(2)}/pip`
  return `$${val.toFixed(4)}/pip`
}

/* ── Per-combination signal matrix ──────────────────────────────────────────── */
// Each entry defines a unique, realistic signal configuration for one symbol×mode pair.
// slPct: stop-loss distance as a fraction of base price (varies by symbol volatility & mode).
// baseConf: base confidence before risk profile adjustment.

interface CombinationSeed {
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
  slPct: number
  baseConf: number
  technicals: { rsi: boolean; macd: boolean; ema: boolean; sr: boolean }
  timestamp: string
  reason: string
}

const SIGNAL_MATRIX: Record<string, CombinationSeed> = {
  // ── XAUUSD ────────────────────────────────────────────────────────────────────
  'XAUUSD:swing': {
    direction: 'BUY',
    slPct: 0.004,
    baseConf: 82,
    technicals: { rsi: true, macd: true, ema: true, sr: false },
    timestamp: '2 min ago',
    reason: 'Strong uptrend continuation; RSI 62 with MACD bullish crossover above zero line',
  },
  'XAUUSD:intraday': {
    direction: 'SELL',
    slPct: 0.0018,
    baseConf: 71,
    technicals: { rsi: true, macd: false, ema: true, sr: true },
    timestamp: '5 min ago',
    reason: 'RSI 74 overbought at resistance zone; intraday reversal with bearish divergence',
  },
  'XAUUSD:scalper': {
    direction: 'BUY',
    slPct: 0.00075,
    baseConf: 78,
    technicals: { rsi: false, macd: true, ema: true, sr: true },
    timestamp: '1 min ago',
    reason: 'Momentum scalp off EMA cluster; tight entry at micro breakout level',
  },

  // ── XAGUSD ────────────────────────────────────────────────────────────────────
  'XAGUSD:swing': {
    direction: 'SELL',
    slPct: 0.005,
    baseConf: 68,
    technicals: { rsi: true, macd: false, ema: false, sr: true },
    timestamp: '8 min ago',
    reason: 'Silver lagging gold in downtrend; RSI 58 weakening with failed resistance retest',
  },
  'XAGUSD:intraday': {
    direction: 'BUY',
    slPct: 0.0022,
    baseConf: 64,
    technicals: { rsi: true, macd: true, ema: false, sr: false },
    timestamp: '3 min ago',
    reason: 'Oversold bounce from intraday support; RSI 32 with MACD histogram uptick',
  },
  'XAGUSD:scalper': {
    direction: 'SELL',
    slPct: 0.0009,
    baseConf: 61,
    technicals: { rsi: false, macd: true, ema: false, sr: true },
    timestamp: '4 min ago',
    reason: 'Quick fade from minor resistance; MACD rolling over with negative momentum burst',
  },

  // ── BTCUSD ────────────────────────────────────────────────────────────────────
  'BTCUSD:swing': {
    direction: 'BUY',
    slPct: 0.005,
    baseConf: 76,
    technicals: { rsi: true, macd: true, ema: true, sr: true },
    timestamp: '12 min ago',
    reason: 'Weekly structure breakout above $83K; RSI 58 with MACD bullish crossover on daily',
  },
  'BTCUSD:intraday': {
    direction: 'SELL',
    slPct: 0.0022,
    baseConf: 67,
    technicals: { rsi: true, macd: false, ema: true, sr: false },
    timestamp: '6 min ago',
    reason: 'Failed breakout at $85K resistance; RSI 71 divergence on 1H with bearish engulf',
  },
  'BTCUSD:scalper': {
    direction: 'BUY',
    slPct: 0.0009,
    baseConf: 72,
    technicals: { rsi: false, macd: true, ema: true, sr: true },
    timestamp: '2 min ago',
    reason: 'Fast momentum scalp; MACD accelerating with price bouncing off EMA ribbon support',
  },

  // ── ETHUSD ────────────────────────────────────────────────────────────────────
  'ETHUSD:swing': {
    direction: 'SELL',
    slPct: 0.0045,
    baseConf: 65,
    technicals: { rsi: true, macd: true, ema: false, sr: false },
    timestamp: '15 min ago',
    reason: 'ETH underperforming BTC; bearish structure below EMA200 with MACD death cross',
  },
  'ETHUSD:intraday': {
    direction: 'BUY',
    slPct: 0.002,
    baseConf: 70,
    technicals: { rsi: true, macd: true, ema: true, sr: false },
    timestamp: '4 min ago',
    reason: 'Intraday V-reversal from oversold; RSI 35 curling with MACD crossover on 15M',
  },
  'ETHUSD:scalper': {
    direction: 'BUY',
    slPct: 0.00085,
    baseConf: 66,
    technicals: { rsi: false, macd: true, ema: true, sr: false },
    timestamp: '1 min ago',
    reason: 'Continuation scalp within EMA cluster; MACD positive and price holding above pivot',
  },

  // ── XRPUSD ────────────────────────────────────────────────────────────────────
  'XRPUSD:swing': {
    direction: 'BUY',
    slPct: 0.006,
    baseConf: 61,
    technicals: { rsi: true, macd: false, ema: false, sr: true },
    timestamp: '10 min ago',
    reason: 'Speculative swing at key horizontal support; RSI 44 recovering but low conviction',
  },
  'XRPUSD:intraday': {
    direction: 'SELL',
    slPct: 0.0026,
    baseConf: 57,
    technicals: { rsi: true, macd: true, ema: false, sr: false },
    timestamp: '7 min ago',
    reason: 'Momentum fade after aggressive spike; RSI 78 extremely overbought on 1H chart',
  },
  'XRPUSD:scalper': {
    direction: 'BUY',
    slPct: 0.001,
    baseConf: 59,
    technicals: { rsi: false, macd: false, ema: true, sr: true },
    timestamp: '3 min ago',
    reason: 'Support bounce scalp at EMA confluence and prior resistance-turned-support level',
  },

  // ── SOLUSD ────────────────────────────────────────────────────────────────────
  'SOLUSD:swing': {
    direction: 'BUY',
    slPct: 0.005,
    baseConf: 73,
    technicals: { rsi: true, macd: true, ema: true, sr: false },
    timestamp: '9 min ago',
    reason: 'SOL breaking above weekly consolidation; RSI 55 with MACD bullish crossover on daily',
  },
  'SOLUSD:intraday': {
    direction: 'SELL',
    slPct: 0.002,
    baseConf: 70,
    technicals: { rsi: true, macd: true, ema: false, sr: true },
    timestamp: '5 min ago',
    reason: 'Failed test of $150 resistance; RSI 69 with bearish divergence and volume fade',
  },
  'SOLUSD:scalper': {
    direction: 'BUY',
    slPct: 0.0008,
    baseConf: 68,
    technicals: { rsi: false, macd: true, ema: true, sr: true },
    timestamp: '2 min ago',
    reason: 'Quick scalp off EMA20 support; MACD histogram positive and price holding pivot zone',
  },

  // ── DOGEUSD ───────────────────────────────────────────────────────────────────
  'DOGEUSD:swing': {
    direction: 'SELL',
    slPct: 0.007,
    baseConf: 58,
    technicals: { rsi: true, macd: false, ema: false, sr: true },
    timestamp: '14 min ago',
    reason: 'DOGE at key resistance after speculative pump; RSI 68 weakening with low volume',
  },
  'DOGEUSD:intraday': {
    direction: 'BUY',
    slPct: 0.003,
    baseConf: 62,
    technicals: { rsi: true, macd: true, ema: false, sr: false },
    timestamp: '6 min ago',
    reason: 'Intraday oversold bounce; RSI 31 with MACD histogram turning positive on 1H',
  },
  'DOGEUSD:scalper': {
    direction: 'BUY',
    slPct: 0.001,
    baseConf: 55,
    technicals: { rsi: false, macd: false, ema: true, sr: true },
    timestamp: '3 min ago',
    reason: 'Micro support hold at EMA cluster; low conviction scalp with tight risk management',
  },

  // ── ADAUSD ────────────────────────────────────────────────────────────────────
  'ADAUSD:swing': {
    direction: 'BUY',
    slPct: 0.006,
    baseConf: 66,
    technicals: { rsi: true, macd: true, ema: false, sr: true },
    timestamp: '11 min ago',
    reason: 'ADA retesting breakout zone as support; RSI 48 with MACD curling bullish on daily',
  },
  'ADAUSD:intraday': {
    direction: 'SELL',
    slPct: 0.0025,
    baseConf: 64,
    technicals: { rsi: true, macd: false, ema: true, sr: true },
    timestamp: '7 min ago',
    reason: 'Rejection at $0.75 resistance; RSI 66 declining with price below EMA50 on 4H',
  },
  'ADAUSD:scalper': {
    direction: 'SELL',
    slPct: 0.001,
    baseConf: 59,
    technicals: { rsi: false, macd: true, ema: false, sr: true },
    timestamp: '4 min ago',
    reason: 'Scalp short from minor resistance; MACD rolling over with negative delta pressure',
  },

  // ── EURUSD ────────────────────────────────────────────────────────────────────
  'EURUSD:swing': {
    direction: 'BUY',
    slPct: 0.004,
    baseConf: 74,
    technicals: { rsi: true, macd: true, ema: true, sr: false },
    timestamp: '8 min ago',
    reason: 'EUR recovering on ECB hawkish tone; RSI 54 rising with MACD bullish cross on daily',
  },
  'EURUSD:intraday': {
    direction: 'SELL',
    slPct: 0.0015,
    baseConf: 68,
    technicals: { rsi: true, macd: false, ema: true, sr: true },
    timestamp: '4 min ago',
    reason: 'Intraday rejection at 1.0900 supply zone; RSI 67 bearish divergence on 1H',
  },
  'EURUSD:scalper': {
    direction: 'BUY',
    slPct: 0.0006,
    baseConf: 65,
    technicals: { rsi: false, macd: true, ema: true, sr: true },
    timestamp: '1 min ago',
    reason: 'Quick long from EMA confluence support; MACD positive momentum and tight S/R hold',
  },

  // ── GBPUSD ────────────────────────────────────────────────────────────────────
  'GBPUSD:swing': {
    direction: 'SELL',
    slPct: 0.005,
    baseConf: 70,
    technicals: { rsi: true, macd: true, ema: false, sr: true },
    timestamp: '10 min ago',
    reason: 'GBP weakening on soft UK data; RSI 62 with MACD bearish crossover near 1.2700 key level',
  },
  'GBPUSD:intraday': {
    direction: 'BUY',
    slPct: 0.0018,
    baseConf: 72,
    technicals: { rsi: true, macd: true, ema: true, sr: false },
    timestamp: '5 min ago',
    reason: 'Intraday support hold at 1.2600; RSI 38 reversing with MACD positive cross on 1H',
  },
  'GBPUSD:scalper': {
    direction: 'SELL',
    slPct: 0.0007,
    baseConf: 63,
    technicals: { rsi: false, macd: true, ema: false, sr: true },
    timestamp: '2 min ago',
    reason: 'Short scalp at minor resistance; MACD rolling negative with momentum fade on 5M',
  },

  // ── USDJPY ────────────────────────────────────────────────────────────────────
  'USDJPY:swing': {
    direction: 'BUY',
    slPct: 0.004,
    baseConf: 77,
    technicals: { rsi: true, macd: true, ema: true, sr: true },
    timestamp: '6 min ago',
    reason: 'USD strength on Fed hawkish hold; RSI 58 with MACD bullish and price above EMA50/200',
  },
  'USDJPY:intraday': {
    direction: 'BUY',
    slPct: 0.0015,
    baseConf: 69,
    technicals: { rsi: true, macd: false, ema: true, sr: true },
    timestamp: '3 min ago',
    reason: 'Pullback buy at 149.00 support; RSI 46 recovering and price bouncing off EMA20',
  },
  'USDJPY:scalper': {
    direction: 'SELL',
    slPct: 0.0006,
    baseConf: 66,
    technicals: { rsi: false, macd: true, ema: false, sr: true },
    timestamp: '1 min ago',
    reason: 'Scalp short from 149.80 intraday resistance; MACD histogram turning negative on 5M',
  },

  // ── AUDUSD ────────────────────────────────────────────────────────────────────
  'AUDUSD:swing': {
    direction: 'SELL',
    slPct: 0.005,
    baseConf: 63,
    technicals: { rsi: true, macd: false, ema: false, sr: true },
    timestamp: '13 min ago',
    reason: 'AUD under pressure from weak China data; RSI 57 declining below supply zone at 0.6600',
  },
  'AUDUSD:intraday': {
    direction: 'SELL',
    slPct: 0.0018,
    baseConf: 65,
    technicals: { rsi: true, macd: true, ema: false, sr: false },
    timestamp: '6 min ago',
    reason: 'Momentum short on failed rally; RSI 63 with MACD bearish crossover on 4H chart',
  },
  'AUDUSD:scalper': {
    direction: 'BUY',
    slPct: 0.0007,
    baseConf: 60,
    technicals: { rsi: false, macd: false, ema: true, sr: true },
    timestamp: '2 min ago',
    reason: 'Micro bounce scalp at EMA support; price stalling at prior support-turned-resistance',
  },
}

/* ── Risk confidence adjustment ──────────────────────────────────────────────── */

const RISK_ADJ: Record<RiskProfile, number> = { conservative: -8, balanced: 0, 'high-risk': 6 }

/* ── Build signal ────────────────────────────────────────────────────────────── */

export function buildSignal(symbol: string, mode: TradingMode, risk: RiskProfile): SignalData {
  const key = `${symbol}:${mode}`
  const seed = SIGNAL_MATRIX[key]
  if (!seed) throw new Error(`No signal matrix entry for ${key}`)

  const price = BASE_PRICES[symbol] ?? 100
  const slDistance = price * seed.slPct
  const tp1Distance = slDistance * 1.618
  const tp2Distance = slDistance * 2.618
  const tp3Distance = slDistance * 4.236

  const entry = price
  const sl = seed.direction === 'BUY' ? entry - slDistance : entry + slDistance
  const tp1 = seed.direction === 'BUY' ? entry + tp1Distance : entry - tp1Distance
  const tp2 = seed.direction === 'BUY' ? entry + tp2Distance : entry - tp2Distance
  const tp3 = seed.direction === 'BUY' ? entry + tp3Distance : entry - tp3Distance

  const confidence = Math.max(35, Math.min(96, seed.baseConf + RISK_ADJ[risk]))

  return {
    direction: seed.direction,
    confidence,
    entryPrice: entry,
    stopLoss: sl,
    tp1,
    tp2,
    tp3,
    timestamp: seed.timestamp,
    technicals: seed.technicals,
    reason: seed.reason,
  }
}
