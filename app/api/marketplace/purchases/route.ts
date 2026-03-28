import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/app/lib/session'
import { checkRateLimit } from '@/app/lib/apiGuard'
import { getUserPurchases } from '@/app/lib/marketplace'

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request)
  if (rl) return rl

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const purchases = await getUserPurchases(session.userId)
  return NextResponse.json({ purchases })
}
