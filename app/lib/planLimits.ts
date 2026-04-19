import { prisma } from '@/app/lib/prisma'
import { SYMBOL_REGISTRY } from '@/app/lib/symbols'

const FREE_SIGNALS_PER_DAY = 99999
const FREE_ASSET_LIMIT = 99999

// Keep structure unchanged
const FREE_SYMBOLS = SYMBOL_REGISTRY
  .slice(0, FREE_ASSET_LIMIT)
  .map((s) => s.symbol)

// 🔥 Force all users to highest plan
async function getUserPlanFromDb(userId: string): Promise<string> {
  return 'pro' // important: some logic only checks for 'pro'
}

// 🔥 Remove all signal limits
export async function checkSignalLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  return { allowed: true, remaining: Infinity }
}

// 🔥 Allow access to all assets
export async function checkAssetAccess(
  userId: string,
  symbol: string
): Promise<boolean> {
  return true
}

// 🔥 Always Pro
export async function isPro(userId: string): Promise<boolean> {
  return true
}

// 🔥 Always Elite
export async function isElite(userId: string): Promise<boolean> {
  return true
}

export { FREE_SYMBOLS }
