'use client'

import { useState, useRef, useCallback } from 'react'
import type { SignalDirection } from '../lib/signalEngine'
import { fmt } from '../lib/symbols'

interface ShareSignalProps {
  symbol: string
  direction: SignalDirection
  confidence: number
  mode: string
  risk: string
  entryPrice: number
  technicals: { rsi: boolean; macd: boolean; ema: boolean; sr: boolean; bollinger?: boolean; stochastic?: boolean }
  reason: string
}

export default function ShareSignal({
  symbol,
  direction,
  confidence,
  mode,
  risk,
  entryPrice,
  technicals,
  reason,
}: ShareSignalProps) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const dirColor = direction === 'BUY' ? '#3b82f6' : direction === 'SELL' ? '#ef4444' : '#f59e0b'
  const agreeing = Object.values(technicals).filter(Boolean).length
  const total = Object.keys(technicals).length

  const timestamp = new Date().toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Generate text format for clipboard
  const generateText = useCallback(() => {
    const techList = Object.entries(technicals)
      .map(([key, val]) => `${val ? '✅' : '❌'} ${key.toUpperCase()}`)
      .join(' ')

    return [
      `🔔 ALPHA SCANNER SIGNAL`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `📊 ${symbol} | ${direction} Signal`,
      `🎯 Confidence: ${confidence}%`,
      `💰 Entry: ${fmt(symbol, entryPrice)}`,
      `📈 Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
      `⚡ Risk: ${risk.charAt(0).toUpperCase() + risk.slice(1)}`,
      ``,
      `📋 Indicators (${agreeing}/${total}):`,
      techList,
      ``,
      `💡 ${reason}`,
      ``,
      `⏰ ${timestamp}`,
      `🔗 Alpha Scanner`,
    ].join('\n')
  }, [symbol, direction, confidence, entryPrice, mode, risk, technicals, reason, agreeing, total, timestamp])

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = generateText()
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [generateText])

  // Download as PNG using Canvas API
  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const W = 600
      const H = 400
      const DPR = 2
      canvas.width = W * DPR
      canvas.height = H * DPR
      ctx.scale(DPR, DPR)

      // Background
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, W, H)

      // Border accent
      ctx.fillStyle = dirColor
      ctx.fillRect(0, 0, W, 4)

      // Title
      ctx.font = 'bold 14px monospace'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('ALPHA SCANNER', 24, 36)

      // Symbol + Direction
      ctx.font = 'bold 28px monospace'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(symbol, 24, 76)

      // Direction badge
      const dirText = direction
      ctx.font = 'bold 18px monospace'
      const dirWidth = ctx.measureText(dirText).width
      const badgeX = 24 + ctx.measureText(symbol + '  ').width
      ctx.fillStyle = dirColor + '30'
      ctx.fillRect(badgeX - 6, 56, dirWidth + 12, 26)
      ctx.fillStyle = dirColor
      ctx.fillText(dirText, badgeX, 76)

      // Confidence
      ctx.font = '13px monospace'
      ctx.fillStyle = '#9ca3af'
      ctx.fillText(`Confidence: ${confidence}%`, 24, 108)

      // Confidence bar
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(24, 116, W - 48, 8)
      ctx.fillStyle = dirColor
      ctx.fillRect(24, 116, (W - 48) * (confidence / 100), 8)

      // Entry + Mode
      ctx.font = '13px monospace'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(`Entry: ${fmt(symbol, entryPrice)}`, 24, 150)
      ctx.fillText(`Mode: ${mode} · Risk: ${risk}`, 24, 170)

      // Indicators
      ctx.font = 'bold 11px monospace'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(`INDICATORS (${agreeing}/${total})`, 24, 202)

      const techEntries = Object.entries(technicals)
      let tx = 24
      ctx.font = '11px monospace'
      for (const [key, val] of techEntries) {
        const icon = val ? '✓' : '✗'
        ctx.fillStyle = val ? '#22c55e' : '#4b5563'
        const label = `${icon} ${key.toUpperCase()}`
        ctx.fillText(label, tx, 222)
        tx += ctx.measureText(label).width + 16
      }

      // Reason (truncated)
      ctx.font = '11px monospace'
      ctx.fillStyle = '#6b7280'
      const reasonTrunc = reason.length > 80 ? reason.slice(0, 80) + '...' : reason
      ctx.fillText(reasonTrunc, 24, 256)

      // Footer
      ctx.font = '10px monospace'
      ctx.fillStyle = '#333'
      ctx.fillText(timestamp, 24, H - 20)
      ctx.fillText('alpha-scanner', W - 120, H - 20)

      // Download
      const link = document.createElement('a')
      link.download = `alpha-signal-${symbol}-${direction}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      // silent
    } finally {
      setDownloading(false)
    }
  }, [symbol, direction, confidence, entryPrice, mode, risk, technicals, reason, dirColor, agreeing, total, timestamp])

  // Web Share API
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${symbol} ${direction} Signal`,
          text: generateText(),
        })
      } catch {
        // User cancelled
      }
    } else {
      handleCopy()
    }
  }, [symbol, direction, generateText, handleCopy])

  return (
    <>
      {/* Share button (inline in SignalPanel) */}
      <button
        onClick={() => setShowModal(true)}
        className="rounded border border-[#222] bg-[#1a1a1a] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gray-500 transition-all hover:border-[#8b5cf6] hover:text-[#8b5cf6] hover:bg-[#8b5cf6]/10 active:scale-95"
        aria-label="Share signal"
      >
        📤 Share
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-lg border border-[#222] bg-[#111] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#222] px-4 py-3">
              <h4 className="text-sm font-semibold text-white">Share Signal</h4>
              <button
                onClick={() => setShowModal(false)}
                className="rounded p-1 text-gray-600 hover:text-gray-300 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Signal preview card */}
            <div className="p-4">
              <div
                ref={cardRef}
                className="rounded-lg border bg-[#0a0a0a] p-4"
                style={{ borderColor: `${dirColor}40`, borderTopColor: dirColor, borderTopWidth: '3px' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{symbol}</span>
                    <span
                      className="rounded px-2 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: `${dirColor}20`,
                        color: dirColor,
                      }}
                    >
                      {direction}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold" style={{ color: dirColor }}>
                    {confidence}%
                  </span>
                </div>
                <div className="space-y-1 text-[10px] text-gray-500">
                  <p>Entry: {fmt(symbol, entryPrice)}</p>
                  <p>Mode: {mode} · Risk: {risk}</p>
                  <p>Indicators: {agreeing}/{total} agree</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(technicals).map(([key, val]) => (
                    <span
                      key={key}
                      className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase"
                      style={{
                        backgroundColor: val ? '#22c55e18' : '#22222280',
                        color: val ? '#22c55e' : '#4b5563',
                      }}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-[#222] px-4 py-3">
              <button
                onClick={handleCopy}
                className="flex-1 rounded border border-[#222] bg-[#1a1a1a] py-2 text-xs font-semibold text-gray-300 transition-all hover:bg-[#222] active:scale-[0.97]"
              >
                {copied ? '✅ Copied!' : '📋 Copy Text'}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 rounded border border-[#222] bg-[#1a1a1a] py-2 text-xs font-semibold text-gray-300 transition-all hover:bg-[#222] active:scale-[0.97] disabled:opacity-50"
              >
                {downloading ? '⏳ Generating...' : '🖼️ Download PNG'}
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="rounded border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-3 py-2 text-xs font-semibold text-[#8b5cf6] transition-all hover:bg-[#8b5cf6]/20 active:scale-[0.97]"
                >
                  📤
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
