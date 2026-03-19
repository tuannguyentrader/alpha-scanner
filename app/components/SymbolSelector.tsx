'use client'

import { useState, useEffect, useRef } from 'react'
import { fmt } from '../data/mockSignals'
import type { SymbolPrice } from '../hooks/usePrices'

export type SymbolInfo = {
  symbol: string
  name: string
  category: 'Commodity' | 'Crypto'
  icon: string
  mockPrice: string
  mockChange: string
  changePositive: boolean
}

export const SYMBOLS: SymbolInfo[] = [
  {
    symbol: 'XAUUSD',
    name: 'Gold',
    category: 'Commodity',
    icon: '🥇',
    mockPrice: '2,164.50',
    mockChange: '+0.34%',
    changePositive: true,
  },
  {
    symbol: 'XAGUSD',
    name: 'Silver',
    category: 'Commodity',
    icon: '🥈',
    mockPrice: '24.89',
    mockChange: '-0.12%',
    changePositive: false,
  },
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin',
    category: 'Crypto',
    icon: '₿',
    mockPrice: '87,432.00',
    mockChange: '+1.24%',
    changePositive: true,
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum',
    category: 'Crypto',
    icon: 'Ξ',
    mockPrice: '3,245.80',
    mockChange: '+0.87%',
    changePositive: true,
  },
  {
    symbol: 'XRPUSD',
    name: 'Ripple',
    category: 'Crypto',
    icon: '✕',
    mockPrice: '0.6234',
    mockChange: '-0.45%',
    changePositive: false,
  },
]

type Props = {
  selected: string
  onSelect: (symbol: string) => void
  prices?: Record<string, SymbolPrice> | null
  pricesLoading?: boolean
}

function formatChange(change: number): { text: string; positive: boolean } {
  const positive = change >= 0
  return { text: `${positive ? '+' : ''}${change.toFixed(2)}%`, positive }
}

export default function SymbolSelector({ selected, onSelect, prices, pricesLoading }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [flashingSymbols, setFlashingSymbols] = useState<Record<string, boolean>>({})
  const prevPricesRef = useRef<Record<string, SymbolPrice> | null>(null)

  useEffect(() => {
    if (!prices) return
    const newFlashing: Record<string, boolean> = {}
    if (prevPricesRef.current) {
      for (const sym of Object.keys(prices)) {
        if (prevPricesRef.current[sym]?.price !== prices[sym]?.price) {
          newFlashing[sym] = true
        }
      }
    }
    prevPricesRef.current = prices
    if (Object.keys(newFlashing).length > 0) {
      setFlashingSymbols(newFlashing)
      const t = setTimeout(() => setFlashingSymbols({}), 800)
      return () => clearTimeout(t)
    }
  }, [prices])

  const categories = ['Commodity', 'Crypto'] as const
  const selectedInfo = SYMBOLS.find((s) => s.symbol === selected)

  return (
    <div className="rounded-lg border border-[#222] bg-[#1a1a1a] overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-3 transition-colors hover:bg-[#111] active:bg-[#111]"
        aria-expanded={expanded}
        aria-controls="symbol-selector-content"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500 flex-shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <div className="text-left">
            <p className="text-xs font-semibold text-white">Symbol</p>
            <p className="text-[10px] text-gray-600">Asset Selector</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedInfo && (
            <span className="rounded bg-[#111] px-1.5 py-0.5 font-mono text-[10px] text-[#3b82f6]">
              {selectedInfo.symbol}
            </span>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`text-gray-600 transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div
          id="symbol-selector-content"
          className="border-t border-[#222] px-3 pb-3 pt-2"
        >
          {categories.map((cat) => {
            const syms = SYMBOLS.filter((s) => s.category === cat)
            return (
              <div key={cat} className="mb-2 last:mb-0">
                {/* Category label */}
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: cat === 'Commodity' ? '#f59e0b' : '#8b5cf6',
                    }}
                    aria-hidden="true"
                  />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                    {cat === 'Commodity' ? 'Commodities' : 'Cryptocurrencies'}
                  </span>
                </div>

                {/* Symbol buttons */}
                <div className="flex flex-col gap-1" role="radiogroup" aria-label={cat}>
                  {syms.map((s) => {
                    const isActive = s.symbol === selected
                    const livePrice = prices?.[s.symbol]
                    const isFlashing = flashingSymbols[s.symbol] ?? false

                    // Determine display values
                    let displayPrice: string
                    let displayChange: string
                    let changePositive: boolean

                    if (livePrice) {
                      displayPrice = fmt(s.symbol, livePrice.price)
                      const ch = formatChange(livePrice.change24h)
                      displayChange = ch.text
                      changePositive = ch.positive
                    } else {
                      displayPrice = s.mockPrice
                      displayChange = s.mockChange
                      changePositive = s.changePositive
                    }

                    return (
                      <button
                        key={s.symbol}
                        onClick={() => onSelect(s.symbol)}
                        role="radio"
                        aria-checked={isActive}
                        className={[
                          'group flex items-center justify-between rounded-md border px-2.5 py-2.5 transition-all duration-150 active:scale-[0.98]',
                          isActive
                            ? 'border-[#3b82f6]/40 bg-[#3b82f6]/10'
                            : 'border-[#222] bg-[#111] hover:border-[#333] hover:bg-[#1a1a1a]',
                          isFlashing ? 'ring-1 ring-[#22c55e]/40' : '',
                        ].join(' ')}
                        style={isActive ? { boxShadow: '0 0 10px rgba(59,130,246,0.12)' } : undefined}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm flex-shrink-0" aria-hidden="true">{s.icon}</span>
                          <div className="text-left min-w-0">
                            <span
                              className={[
                                'font-mono text-[11px] font-bold',
                                isActive ? 'text-[#3b82f6]' : 'text-gray-300',
                              ].join(' ')}
                            >
                              {s.symbol}
                            </span>
                            <span className="ml-1.5 text-[9px] text-gray-600">{s.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {pricesLoading && !livePrice ? (
                            <span className="hidden sm:block h-2 w-14 rounded bg-[#222] animate-pulse" />
                          ) : (
                            <span
                              className={[
                                'hidden sm:inline font-mono text-[10px] transition-colors',
                                isFlashing ? 'text-[#22c55e]' : 'text-gray-500',
                              ].join(' ')}
                            >
                              {displayPrice}
                            </span>
                          )}
                          <span
                            className={[
                              'font-mono text-[9px] font-semibold',
                              changePositive ? 'text-[#22c55e]' : 'text-[#ef4444]',
                            ].join(' ')}
                          >
                            {displayChange}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
