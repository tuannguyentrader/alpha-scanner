import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { nanoid } from 'nanoid'

function maskKey(key: string): string {
  // Show first 6 (includes "as_" prefix + 3) and last 4 chars
  return `${key.slice(0, 6)}${'•'.repeat(key.length - 10)}${key.slice(-4)}`
}

// GET /api/api-keys — list user's API keys (masked)
export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    keys.map((k) => ({
      id: k.id,
      name: k.name,
      maskedKey: maskKey(k.key),
      plan: k.plan,
      requestsToday: k.requestsToday,
      lastResetAt: k.lastResetAt,
      expiresAt: k.expiresAt,
      enabled: k.enabled,
      createdAt: k.createdAt,
    })),
  )
}

// POST /api/api-keys — create a new API key (Pro+ only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { isPro: proCheck } = await import('@/app/lib/planLimits')
  const pro = await proCheck(userId)
  if (!pro) {
    return NextResponse.json(
      { error: 'API key creation requires a Pro plan. Upgrade at /pricing' },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  // Generate key: "as_" prefix + 32-char nanoid
  const rawKey = `as_${nanoid(32)}`

  const key = await prisma.apiKey.create({
    data: {
      userId,
      key: rawKey,
      name,
    },
  })

  // Full key returned ONLY on creation
  return NextResponse.json(
    {
      id: key.id,
      name: key.name,
      key: key.key, // full key — show once
      plan: key.plan,
      requestsToday: key.requestsToday,
      enabled: key.enabled,
      createdAt: key.createdAt,
    },
    { status: 201 },
  )
}
