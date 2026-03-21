import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { checkRateLimit } from '@/app/lib/apiGuard'

export async function GET(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const { searchParams } = new URL(request.url)
  const webhookId = searchParams.get('webhookId')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

  const where = webhookId ? { webhookId } : {}

  const logs = await prisma.webhookLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      webhook: { select: { url: true } },
    },
  })

  return NextResponse.json(logs)
}
