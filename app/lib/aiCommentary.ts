/* ── AI Signal Commentary ─────────────────────────────────────────────────── */
// Generates a 2-sentence plain-English explanation of why a signal fired.
// Uses OpenAI GPT-4o-mini if OPENAI_API_KEY is set, otherwise returns a
// rule-based fallback. Never crashes — graceful degradation is the default.

import type { GeneratedSignal } from './signalEngine'

interface CommentaryInput {
  symbol: string
  signal: GeneratedSignal
  rsi?: number
  macdHistogram?: number
  ema20?: number
  ema50?: number
  price?: number
}

const commentaryCache = new Map<string, { text: string; expiresAt: number; isAI: boolean }>()
const CACHE_TTL = 120_000 // 2 minutes

/* ── Fallback: rule-based commentary ──────────────────────────────────────── */

function generateFallbackCommentary(input: CommentaryInput): string {
  const { symbol, signal } = input
  const { direction, confidence, technicals, reason } = signal

  if (direction === 'NEUTRAL') {
    return `${symbol} shows mixed signals with no clear directional bias. Indicators are conflicting — wait for a clearer setup before entering.`
  }

  const aligned = Object.entries(technicals)
    .filter(([, v]) => v)
    .map(([k]) => k.toUpperCase())

  const alignedStr = aligned.length > 0 ? aligned.join(', ') : 'multiple factors'

  const confLabel = confidence >= 75 ? 'strong' : confidence >= 50 ? 'moderate' : 'weak'

  if (direction === 'BUY') {
    return `${symbol} is showing a ${confLabel} bullish setup with ${alignedStr} aligned in favor. ${reason}`
  } else {
    return `${symbol} is showing a ${confLabel} bearish setup with ${alignedStr} signaling downside pressure. ${reason}`
  }
}

/* ── OpenAI GPT-4o-mini commentary ────────────────────────────────────────── */

async function generateAICommentary(input: CommentaryInput): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const { symbol, signal } = input
  const { direction, confidence, technicals, reason } = signal

  const prompt = `You are a concise trading signal analyst. Given the following signal data, write exactly 2 sentences explaining WHY this signal fired — which indicators aligned and what the key confluence was. Be specific and actionable. No disclaimers.

Symbol: ${symbol}
Direction: ${direction}
Confidence: ${confidence}%
Active Indicators: ${Object.entries(technicals).filter(([, v]) => v).map(([k]) => k).join(', ')}
Engine Reason: ${reason}
${input.rsi !== undefined ? `RSI: ${input.rsi.toFixed(1)}` : ''}
${input.macdHistogram !== undefined ? `MACD Histogram: ${input.macdHistogram.toFixed(4)}` : ''}
${input.price !== undefined ? `Current Price: ${input.price}` : ''}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000) // 8s timeout

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
        temperature: 0.7,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content?.trim()
    return text || null
  } catch {
    return null
  }
}

/* ── Public API ────────────────────────────────────────────────────────────── */

export async function getSignalCommentary(input: CommentaryInput): Promise<{ text: string; isAI: boolean }> {
  const cacheKey = `${input.symbol}:${input.signal.direction}:${input.signal.confidence}`
  const cached = commentaryCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return { text: cached.text, isAI: cached.isAI }
  }

  // Try AI first
  const aiText = await generateAICommentary(input)
  if (aiText) {
    const result = { text: aiText, isAI: true }
    commentaryCache.set(cacheKey, { ...result, expiresAt: Date.now() + CACHE_TTL })
    return result
  }

  // Fallback
  const fallbackText = generateFallbackCommentary(input)
  const result = { text: fallbackText, isAI: false }
  commentaryCache.set(cacheKey, { ...result, expiresAt: Date.now() + CACHE_TTL })
  return result
}
