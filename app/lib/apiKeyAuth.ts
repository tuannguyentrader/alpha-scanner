import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import type { ApiKey } from '@prisma/client'

const RATE_LIMITS: Record<string, number> = {
  free: 100,
  pro: 10000,
}

export interface ApiKeyAuthResult {
  valid: boolean
  key?: ApiKey
  error?: string
}

export async function validateApiKey(request: NextRequest): Promise<ApiKeyAuthResult> {
  // Extract key from Authorization header or query param
  const authHeader = request.headers.get('authorization') ?? ''
  const queryParam = new URL(request.url).searchParams.get('api_key') ?? ''

  let rawKey = ''
  if (authHeader.startsWith('Bearer ')) {
    rawKey = authHeader.slice(7).trim()
  } else if (queryParam) {
    rawKey = queryParam.trim()
  }

  if (!rawKey) {
    return { valid: false, error: 'No API key provided' }
  }

  if (!rawKey.startsWith('as_')) {
    return { valid: false, error: 'Invalid API key format' }
  }

  const keyRecord = await prisma.apiKey.findUnique({ where: { key: rawKey } })

  if (!keyRecord) {
    return { valid: false, error: 'Invalid API key' }
  }

  if (!keyRecord.enabled) {
    return { valid: false, error: 'API key is disabled' }
  }

  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' }
  }

  // Auto-reset daily counter if lastResetAt is before today (UTC)
  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const needsReset = keyRecord.lastResetAt < todayUTC

  const limit = RATE_LIMITS[keyRecord.plan] ?? RATE_LIMITS.free
  const currentCount = needsReset ? 0 : keyRecord.requestsToday

  if (currentCount >= limit) {
    return {
      valid: false,
      error: `Rate limit exceeded. ${keyRecord.plan} plan allows ${limit} requests/day`,
    }
  }

  // Increment counter (and reset if needed)
  const updated = await prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: {
      requestsToday: currentCount + 1,
      ...(needsReset ? { lastResetAt: todayUTC } : {}),
    },
  })

  return { valid: true, key: updated }
}
