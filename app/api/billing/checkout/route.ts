import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/app/lib/session'
import { createCheckoutSession, PLANS } from '@/app/lib/stripe'

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { priceId } = body as { priceId?: string }

  if (!priceId) {
    return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })
  }

  // Validate priceId is one of our known prices
  const validPrices = [
    PLANS.pro.monthly,
    PLANS.pro.annual,
    PLANS.elite.monthly,
    PLANS.elite.annual,
  ]
  if (!validPrices.includes(priceId)) {
    return NextResponse.json({ error: 'Invalid priceId' }, { status: 400 })
  }

  const origin = request.headers.get('origin') || 'http://localhost:3000'
  const successUrl = `${origin}/dashboard?billing=success`
  const cancelUrl = `${origin}/pricing?billing=canceled`

  const url = await createCheckoutSession(session.userId, priceId, successUrl, cancelUrl)
  return NextResponse.json({ url })
}
