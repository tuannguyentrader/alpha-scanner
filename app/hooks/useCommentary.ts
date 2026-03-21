'use client'

import { useState, useEffect, useRef } from 'react'
import type { GeneratedSignal } from '../lib/signalEngine'

interface CommentaryResult {
  text: string
  isAI: boolean
}

export function useCommentary(
  symbol: string,
  signal: GeneratedSignal | null,
  price?: number,
) {
  const [commentary, setCommentary] = useState<CommentaryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const lastKey = useRef('')

  useEffect(() => {
    if (!signal) return

    const key = `${symbol}:${signal.direction}:${signal.confidence}`
    if (key === lastKey.current) return
    lastKey.current = key

    setLoading(true)

    fetch('/api/commentary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, signal, price }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setCommentary(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [symbol, signal, price])

  return { commentary, loading }
}
