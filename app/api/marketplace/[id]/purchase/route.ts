import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/app/lib/session'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'
import { getStripe } from '@/app/lib/stripe'
import { hasUserPurchased } from '@/app/lib/marketplace'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await params
  const listing = await prisma.strategyListing.findUnique({ where: { id } })

  if (!listing || !listing.isPublished) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Prevent self-purchase
  if (listing.authorId === session.userId) {
    return NextResponse.json({ error: 'Cannot purchase your own strategy' }, { status: 400 })
  }

  // Check if already purchased
  if (await hasUserPurchased(session.userId, id)) {
    return NextResponse.json({ error: 'Already purchased' }, { status: 400 })
  }

  // Get or create Stripe customer
  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let sub = await prisma.subscription.findUnique({ where: { userId: session.userId } })
  let customerId = sub?.stripeCustomerId

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { userId: session.userId },
    })
    customerId = customer.id
    await prisma.subscription.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    })
  }

  const origin = request.headers.get('origin') || 'http://localhost:3000'
  const platformFee = Math.round(listing.price * 100 * 0.15)

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(listing.price * 100),
          product_data: {
            name: `Strategy: ${listing.name}`,
            description: `Signal strategy by ${listing.authorId}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      listingId: id,
      buyerId: session.userId,
      authorId: listing.authorId,
      platformFee: String(platformFee),
      type: 'marketplace_purchase',
    },
    success_url: `${origin}/marketplace?purchased=${id}`,
    cancel_url: `${origin}/marketplace`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
