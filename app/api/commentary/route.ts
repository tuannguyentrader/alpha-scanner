import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/app/lib/apiGuard'
import { getSignalCommentary } from '@/app/lib/aiCommentary'
import type { GeneratedSignal } from '@/app/lib/signalEngine'

export async function POST(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { symbol, signal, rsi, macdHistogram, ema20, ema50, price } = body as {
      symbol: string
      signal: GeneratedSignal
      rsi?: number
      macdHistogram?: number
      ema20?: number
      ema50?: number
      price?: number
    }

    if (!symbol || !signal) {
      return NextResponse.json({ error: 'symbol and signal required' }, { status: 400 })
    }

    const commentary = await getSignalCommentary({
      symbol,
      signal,
      rsi,
      macdHistogram,
      ema20,
      ema50,
      price,
    })

    return NextResponse.json(commentary)
  } catch {
    return NextResponse.json({ error: 'Failed to generate commentary' }, { status: 500 })
  }
}
