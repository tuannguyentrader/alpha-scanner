import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { connectBroker } from '@/app/lib/brokerApi'
import { checkRateLimit } from '@/app/lib/apiGuard'
import { sanitizeInput, isValidToken, isValidAccountId } from '@/app/lib/sanitize'
import { isElite } from '@/app/lib/planLimits'
import { sessionOptions, type SessionData } from '@/app/lib/session'

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  // Plan gate: Elite only for logged-in users
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    if (session.isLoggedIn && session.userId) {
      const elite = await isElite(session.userId)
      if (!elite) {
        return NextResponse.json(
          { error: 'Broker integration requires an Elite plan. Upgrade at /pricing' },
          { status: 403 },
        )
      }
    }
  } catch {
    // Session read failed — allow request (guest mode)
  }

  try {
    const body = await request.json() as { token?: string; accountId?: string }
    const token = sanitizeInput(body.token ?? '', 512)
    const accountId = sanitizeInput(body.accountId ?? '', 128)

    if (!isValidToken(token)) {
      return NextResponse.json(
        { error: 'Invalid MetaApi token' },
        { status: 400 },
      )
    }

    if (!isValidAccountId(accountId)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 },
      )
    }

    const session = await connectBroker(token, accountId)

    if (session.state === 'error') {
      return NextResponse.json(
        { error: session.lastError ?? 'Connection failed', state: session.state },
        { status: 401 },
      )
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      state: session.state,
      account: session.account,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
