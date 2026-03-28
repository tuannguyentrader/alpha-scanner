import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/app/lib/session'
import { createBillingPortalSession, getUserPlan } from '@/app/lib/stripe'

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { stripeCustomerId } = await getUserPlan(session.userId)
  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  const origin = request.headers.get('origin') || 'http://localhost:3000'
  const returnUrl = `${origin}/pricing`

  const url = await createBillingPortalSession(stripeCustomerId, returnUrl)
  return NextResponse.json({ url })
}
