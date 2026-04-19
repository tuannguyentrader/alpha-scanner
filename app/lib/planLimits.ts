import { prisma } from '@/app/lib/prisma'
import { SYMBOL_REGISTRY } from '@/app/lib/symbols'

const FREE_SIGNALS_PER_DAY = 99999
const FREE_ASSET_LIMIT = 99999

const FREE_SYMBOLS = SYMBOL_REGISTRY.slice(0, FREE_ASSET_LIMIT).map((s) => s.symbol)

// 🔥 sửa nhẹ: bỏ query DB
async function getUserPlanFromDb(userId: string): Promise<string> {
  return 'elite'
}

export async function checkSignalLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  // 🔥 bypass hoàn toàn
  return { allowed: true, remaining: Infinity }
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
