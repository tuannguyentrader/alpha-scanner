import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/app/lib/session'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const url = new URL(request.url)
  const sort = url.searchParams.get('sort') || 'newest'
  const minPrice = parseFloat(url.searchParams.get('minPrice') || '0')
  const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '999999')
  const assetType = url.searchParams.get('assetType') || 'all'
  const authorOnly = url.searchParams.get('author') === 'me'

  let authorId: string | undefined
  if (authorOnly) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    authorId = session.userId
  }

  const where = {
    ...(authorId ? { authorId } : { isPublished: true }),
    price: { gte: minPrice, lte: maxPrice },
    ...(assetType !== 'all' ? { assetType } : {}),
  }

  const listings = await prisma.strategyListing.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { purchases: true } },
    },
    orderBy: sort === 'price' ? { price: 'asc' } : { createdAt: 'desc' },
  })

  // Parse JSON fields and sort by winRate if needed
  const parsed = listings.map((l) => {
    const backtest = JSON.parse(l.backtestResults) as Record<string, unknown>
    return {
      id: l.id,
      name: l.name,
      description: l.description,
      price: l.price,
      assetType: l.assetType,
      isPublished: l.isPublished,
      winRate: typeof backtest.winRate === 'number' ? backtest.winRate : null,
      totalTrades: typeof backtest.totalTrades === 'number' ? backtest.totalTrades : null,
      profitFactor: typeof backtest.profitFactor === 'number' ? backtest.profitFactor : null,
      author: l.author,
      purchaseCount: l._count.purchases,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }
  })

  if (sort === 'winRate') {
    parsed.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
  } else if (sort === 'popular') {
    parsed.sort((a, b) => b.purchaseCount - a.purchaseCount)
  }

  return NextResponse.json({ listings: parsed })
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, price, indicatorsConfig, backtestResults, assetType, isPublished } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (typeof price !== 'number' || price < 0.99) {
    return NextResponse.json({ error: 'Price must be at least $0.99' }, { status: 400 })
  }
  if (!indicatorsConfig) {
    return NextResponse.json({ error: 'Indicators config is required' }, { status: 400 })
  }

  const listing = await prisma.strategyListing.create({
    data: {
      authorId: session.userId,
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      price,
      indicatorsConfig: typeof indicatorsConfig === 'string' ? indicatorsConfig : JSON.stringify(indicatorsConfig),
      backtestResults: backtestResults ? (typeof backtestResults === 'string' ? backtestResults : JSON.stringify(backtestResults)) : '{}',
      assetType: assetType || 'crypto',
      isPublished: isPublished ?? false,
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
