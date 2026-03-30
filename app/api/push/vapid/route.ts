import { NextResponse } from 'next/server'

export async function GET(): Promise<Response> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) {
    return NextResponse.json({ error: 'VAPID not configured' }, { status: 500 })
  }
  return NextResponse.json({ publicKey })
}
