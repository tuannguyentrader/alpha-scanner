import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'

// GET — list all webhook configs
export async function GET(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const webhooks = await prisma.webhookConfig.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(webhooks)
}

// POST — create a new webhook
export async function POST(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { url, secret } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const webhook = await prisma.webhookConfig.create({
      data: { url, secret: secret || null },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }
}

// PUT — update webhook (enable/disable, change URL)
export async function PUT(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id, url, enabled } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (url !== undefined) {
      try { new URL(url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
      data.url = url
    }
    if (enabled !== undefined) data.enabled = enabled

    const webhook = await prisma.webhookConfig.update({
      where: { id },
      data,
    })

    return NextResponse.json(webhook)
  } catch {
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
  }
}

// DELETE — remove webhook
export async function DELETE(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })
    }

    await prisma.webhookConfig.delete({ where: { id } })
    return NextResponse.json({ status: 'deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
  }
}
