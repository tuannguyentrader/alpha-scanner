/* ── Backtesting Engine ───────────────────────────────────────────────────── */
// Replays signals against historical OHLC data to compute performance metrics.
// Pure functions — no side effects.

import type { Candle } from './supportResistance'
import type { TradingMode, RiskProfile } from '../data/mockSignals'
import type { SignalDirection } from './signalEngine'
import { computeAllIndicators } from './technicalAnalysis'
import { computeSR } from './supportResistance'
import { generateSignal } from './signalEngine'
import { calculateATR } from './technicalAnalysis'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface BacktestTrade {
  id: number
  direction: 'BUY' | 'SELL'
  entryPrice: number
  exitPrice: number
  entryTime: number
  exitTime: number
  pnlPercent: number
  result: 'win' | 'loss'
  exitReason: 'tp1' | 'sl' | 'reverse' | 'end'
}

export interface BacktestResult {
  symbol: string
  mode: TradingMode
  risk: RiskProfile
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  profitFactor: number
  maxDrawdownPercent: number
  avgRR: number
  bestTradePercent: number
  worstTradePercent: number
  totalReturnPercent: number
  trades: BacktestTrade[]
  equityCurve: number[]
}

/* ── Engine ────────────────────────────────────────────────────────────────── */

const MIN_WINDOW = 50 // minimum candles for indicator computation

export function runBacktest(
  candles: Candle[],
  symbol: string,
  mode: TradingMode,
  risk: RiskProfile,
): BacktestResult {
  const trades: BacktestTrade[] = []
  const equityCurve: number[] = [10000] // start with $10k
  let equity = 10000
  let peakEquity = 10000
  let maxDrawdownPercent = 0
  let tradeId = 0

  // Current position state
  let inPosition = false
  let positionDir: 'BUY' | 'SELL' = 'BUY'
  let entryPrice = 0
  let entryTime = 0
  let tp1Price = 0
  let slPrice = 0
  let lastDirection: SignalDirection = 'NEUTRAL'

  // Walk through candles from MIN_WINDOW onward
  for (let i = MIN_WINDOW; i < candles.length; i++) {
    const windowCandles = candles.slice(Math.max(0, i - MIN_WINDOW), i + 1)
    const currentCandle = candles[i]
    const currentPrice = currentCandle.close

    // Compute indicators on window
    const indicators = computeAllIndicators(windowCandles)
    const srResult = computeSR(windowCandles, currentPrice)

    // Generate signal
    const signal = generateSignal({
      indicators,
      support: srResult.support,
      resistance: srResult.resistance,
      symbol,
      mode,
      risk,
    })

    // Check existing position for TP/SL hits
    if (inPosition) {
      let exitPrice = 0
      let exitReason: BacktestTrade['exitReason'] = 'end'
      let shouldExit = false

      if (positionDir === 'BUY') {
        if (currentCandle.high >= tp1Price) {
          exitPrice = tp1Price
          exitReason = 'tp1'
          shouldExit = true
        } else if (currentCandle.low <= slPrice) {
          exitPrice = slPrice
          exitReason = 'sl'
          shouldExit = true
        } else if (signal.direction === 'SELL') {
          exitPrice = currentPrice
          exitReason = 'reverse'
          shouldExit = true
        }
      } else {
        if (currentCandle.low <= tp1Price) {
          exitPrice = tp1Price
          exitReason = 'tp1'
          shouldExit = true
        } else if (currentCandle.high >= slPrice) {
          exitPrice = slPrice
          exitReason = 'sl'
          shouldExit = true
        } else if (signal.direction === 'BUY') {
          exitPrice = currentPrice
          exitReason = 'reverse'
          shouldExit = true
        }
      }

      if (shouldExit) {
        const pnlPercent = positionDir === 'BUY'
          ? ((exitPrice - entryPrice) / entryPrice) * 100
          : ((entryPrice - exitPrice) / entryPrice) * 100

        trades.push({
          id: ++tradeId,
          direction: positionDir,
          entryPrice,
          exitPrice,
          entryTime,
          exitTime: currentCandle.time,
          pnlPercent,
          result: pnlPercent > 0 ? 'win' : 'loss',
          exitReason,
        })

        equity *= (1 + pnlPercent / 100)
        equityCurve.push(equity)
        peakEquity = Math.max(peakEquity, equity)
        const dd = ((peakEquity - equity) / peakEquity) * 100
        maxDrawdownPercent = Math.max(maxDrawdownPercent, dd)

        inPosition = false
      }
    }

    // Open new position on direction change
    if (!inPosition && signal.direction !== 'NEUTRAL' && signal.direction !== lastDirection) {
      inPosition = true
      positionDir = signal.direction
      entryPrice = currentPrice
      entryTime = currentCandle.time

      // Compute ATR for TP/SL
      const atr = calculateATR(windowCandles, 14)
      const atrMultiplier = mode === 'scalper' ? 1.0 : mode === 'intraday' ? 1.5 : 2.0

      if (positionDir === 'BUY') {
        slPrice = entryPrice - atr * atrMultiplier
        tp1Price = entryPrice + atr * atrMultiplier * 1.618
      } else {
        slPrice = entryPrice + atr * atrMultiplier
        tp1Price = entryPrice - atr * atrMultiplier * 1.618
      }
    }

    lastDirection = signal.direction
  }

  // Close any remaining position at last price
  if (inPosition && candles.length > 0) {
    const lastPrice = candles[candles.length - 1].close
    const pnlPercent = positionDir === 'BUY'
      ? ((lastPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - lastPrice) / entryPrice) * 100

    trades.push({
      id: ++tradeId,
      direction: positionDir,
      entryPrice,
      exitPrice: lastPrice,
      entryTime,
      exitTime: candles[candles.length - 1].time,
      pnlPercent,
      result: pnlPercent > 0 ? 'win' : 'loss',
      exitReason: 'end',
    })

    equity *= (1 + pnlPercent / 100)
    equityCurve.push(equity)
    peakEquity = Math.max(peakEquity, equity)
    const dd = ((peakEquity - equity) / peakEquity) * 100
    maxDrawdownPercent = Math.max(maxDrawdownPercent, dd)
  }

  // Compute stats
  const wins = trades.filter(t => t.result === 'win').length
  const losses = trades.filter(t => t.result === 'loss').length
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0

  const grossProfit = trades.filter(t => t.pnlPercent > 0).reduce((s, t) => s + t.pnlPercent, 0)
  const grossLoss = Math.abs(trades.filter(t => t.pnlPercent < 0).reduce((s, t) => s + t.pnlPercent, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0

  const avgWin = wins > 0 ? grossProfit / wins : 0
  const avgLoss = losses > 0 ? grossLoss / losses : 0
  const avgRR = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0

  const pnls = trades.map(t => t.pnlPercent)
  const bestTradePercent = pnls.length > 0 ? Math.max(...pnls) : 0
  const worstTradePercent = pnls.length > 0 ? Math.min(...pnls) : 0

  const totalReturnPercent = ((equity - 10000) / 10000) * 100

  return {
    symbol,
    mode,
    risk,
    totalTrades: trades.length,
    wins,
    losses,
    winRate,
    profitFactor,
    maxDrawdownPercent,
    avgRR,
    bestTradePercent,
    worstTradePercent,
    totalReturnPercent,
    trades,
    equityCurve,
  }
}
