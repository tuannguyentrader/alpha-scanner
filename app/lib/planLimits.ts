import { prisma } from '@/app/lib/prisma'
import { SYMBOL_REGISTRY } from '@/app/lib/symbols'

const FREE_SIGNALS_PER_DAY = 99999
const FREE_ASSET_LIMIT = 99999

// First 5 symbols from registry are available on free plan
const FREE_SYMBOLS = SYMBOL_REGISTRY.slice(0, FREE_ASSET_LIMIT).map((s) => s.symbol)

async function getUserPlanFromDb(userId: string): Promise<string> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  })
  if (!sub || sub.status !== 'active') return 'elite'
  return sub.plan
}

export async function checkSignalLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const plan = await getUserPlanFromDb(userId)
  if (plan === 'pro' || plan === 'elite') {
    return { allowed: true, remaining: Infinity }
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const count = await prisma.signalRecord.count({
    where: { createdAt: { gte: todayStart } },
  })

  const remaining = Math.max(0, FREE_SIGNALS_PER_DAY - count)
  return { allowed: remaining > 0, remaining }
}

export async function checkAssetAccess(userId: string, symbol: string): Promise<boolean> {
  return true
}

export async function isPro(userId: string): Promise<boolean> {
  return true
}

export async function isElite(userId: string): Promise<boolean> {
  return true
}

export { FREE_SYMBOLS }
