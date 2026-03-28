import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/app/lib/session'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'
import { hasUserPurchased } from '@/app/lib/marketplace'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const { id } = await params
  const listing = await prisma.strategyListing.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { purchases: true } },
    },
  })

  if (!listing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Check auth for access control
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const userId = session.isLoggedIn ? session.userId : null
  const isOwner = userId === listing.authorId

  // If not published, only owner can see it
  if (!listing.isPublished && !isOwner) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const purchased = userId ? await hasUserPurchased(userId, id) : false
  const backtest = JSON.parse(listing.backtestResults) as Record<string, unknown>

  return NextResponse.json({
    id: listing.id,
    name: listing.name,
    description: listing.description,
    price: listing.price,
    assetType: listing.assetType,
    isPublished: listing.isPublished,
    backtestResults: backtest,
    // Only reveal config to owner or purchaser
    indicatorsConfig: (isOwner || purchased)
      ? JSON.parse(listing.indicatorsConfig)
      : null,
    author: listing.author,
    purchaseCount: listing._count.purchases,
    isOwner,
    purchased,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  })
}

export async function PUT(request: NextRequest, { params }: Params) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await params
  const listing = await prisma.strategyListing.findUnique({ where: { id } })

  if (!listing || listing.authorId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}

  if (body.name !== undefined) data.name = String(body.name).trim()
  if (body.description !== undefined) data.description = String(body.description).trim()
  if (body.price !== undefined) {
    const p = Number(body.price)
    if (isNaN(p) || p < 0.99) {
      return NextResponse.json({ error: 'Price must be at least $0.99' }, { status: 400 })
    }
    data.price = p
  }
  if (body.indicatorsConfig !== undefined) {
    data.indicatorsConfig = typeof body.indicatorsConfig === 'string'
      ? body.indicatorsConfig
      : JSON.stringify(body.indicatorsConfig)
  }
  if (body.backtestResults !== undefined) {
    data.backtestResults = typeof body.backtestResults === 'string'
      ? body.backtestResults
      : JSON.stringify(body.backtestResults)
  }
  if (body.assetType !== undefined) data.assetType = String(body.assetType)
  if (body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished)

  const updated = await prisma.strategyListing.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await params
  const listing = await prisma.strategyListing.findUnique({ where: { id } })

  if (!listing || listing.authorId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.strategyListing.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
