import Stripe from 'stripe'
import { prisma } from '@/app/lib/prisma'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
    })
  }
  return _stripe
}

export const PLANS = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? '',
  },
  elite: {
    monthly: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID ?? '',
    annual: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID ?? '',
  },
} as const

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  // Get or create Stripe customer
  let sub = await prisma.subscription.findUnique({ where: { userId } })

  let customerId = sub?.stripeCustomerId

  if (!customerId) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { userId },
    })
    customerId = customer.id

    // Upsert subscription record with customer ID
    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    })
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  })

  return session.url!
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

export async function getUserPlan(userId: string): Promise<{
  plan: string
  status: string
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
}> {
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  return {
    plan: sub?.plan ?? 'free',
    status: sub?.status ?? 'active',
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    stripeCustomerId: sub?.stripeCustomerId ?? null,
  }
}
