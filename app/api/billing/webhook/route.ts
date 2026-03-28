import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/app/lib/stripe'
import { prisma } from '@/app/lib/prisma'
import type Stripe from 'stripe'

function planFromPriceId(priceId: string): string {
  const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID
  const proAnnual = process.env.STRIPE_PRO_ANNUAL_PRICE_ID
  const eliteMonthly = process.env.STRIPE_ELITE_MONTHLY_PRICE_ID
  const eliteAnnual = process.env.STRIPE_ELITE_ANNUAL_PRICE_ID

  if (priceId === proMonthly || priceId === proAnnual) return 'pro'
  if (priceId === eliteMonthly || priceId === eliteAnnual) return 'elite'
  return 'free'
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const subscriptionId = session.subscription as string
      const customerId = session.customer as string

      if (!userId) break

      // Fetch subscription to get price ID and period end
      const sub = await getStripe().subscriptions.retrieve(subscriptionId)
      const item = sub.items.data[0]
      const priceId = item?.price?.id ?? ''
      const plan = planFromPriceId(priceId)
      const periodEnd = item?.current_period_end
        ? new Date(item.current_period_end * 1000)
        : null

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          plan,
          status: 'active',
          currentPeriodEnd: periodEnd,
        },
        update: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          plan,
          status: 'active',
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const existing = await prisma.subscription.findUnique({
        where: { stripeCustomerId: customerId },
      })
      if (!existing) break

      const updatedItem = sub.items.data[0]
      const priceId = updatedItem?.price?.id ?? ''
      const plan = planFromPriceId(priceId)
      const periodEnd = updatedItem?.current_period_end
        ? new Date(updatedItem.current_period_end * 1000)
        : null

      await prisma.subscription.update({
        where: { stripeCustomerId: customerId },
        data: {
          plan,
          status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : sub.status,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          plan: 'free',
          status: 'canceled',
          stripeSubscriptionId: null,
        },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: 'past_due' },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
