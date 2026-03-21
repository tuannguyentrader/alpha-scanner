import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'

export async function POST(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { symbol, mode, direction, entryPrice, tp1, sl, confidence } = await request.json()

    if (!symbol || !mode || !direction || !entryPrice || !tp1 || !sl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Prevent duplicate records for same symbol+mode within 5 minutes
    const recent = await prisma.signalRecord.findFirst({
      where: {
        symbol,
        mode,
        direction,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recent) {
      return NextResponse.json({ id: recent.id, status: 'duplicate_skipped' })
    }

    const record = await prisma.signalRecord.create({
      data: {
        symbol,
        mode,
        direction,
        entryPrice,
        tp1,
        sl,
        confidence: Math.round(confidence),
      },
    })

    return NextResponse.json({ id: record.id, status: 'recorded' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to record signal' }, { status: 500 })
  }
}
