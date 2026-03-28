import { prisma } from '@/app/lib/prisma'

const PLATFORM_FEE_RATE = 0.15

export async function hasUserPurchased(userId: string, listingId: string): Promise<boolean> {
  const purchase = await prisma.strategyPurchase.findUnique({
    where: { buyerId_listingId: { buyerId: userId, listingId } },
  })
  return !!purchase
}

export async function getUserPurchases(userId: string) {
  return prisma.strategyPurchase.findMany({
    where: { buyerId: userId },
    include: {
      listing: {
        include: { author: { select: { name: true } } },
      },
    },
    orderBy: { purchasedAt: 'desc' },
  })
}

export async function getAuthorEarnings(authorId: string) {
  const listings = await prisma.strategyListing.findMany({
    where: { authorId },
    include: { _count: { select: { purchases: true } } },
  })

  const byListing = listings.map((l) => ({
    listingId: l.id,
    name: l.name,
    price: l.price,
    count: l._count.purchases,
    gross: l.price * l._count.purchases,
    earnings: l.price * l._count.purchases * (1 - PLATFORM_FEE_RATE),
  }))

  const total = byListing.reduce((sum, l) => sum + l.earnings, 0)

  return { total, byListing }
}
