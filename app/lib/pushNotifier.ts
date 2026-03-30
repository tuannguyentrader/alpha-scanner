import webpush from 'web-push'
import { prisma } from './prisma'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = 'mailto:noreply@alpha-scanner.vercel.app'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export interface PushPayload {
  title: string
  body: string
  tag: string
  url?: string
  icon?: string
  badge?: string
}

type NotifPrefKey = 'pushSignalAlerts' | 'pushTpAlerts' | 'pushSlAlerts' | 'pushDailyReport'

async function getSubscriptionsForPref(prefKey: NotifPrefKey) {
  // Get all subscriptions
  const allSubs = await prisma.pushSubscription.findMany()

  // For logged-in users, check their notification preferences
  const userIds = allSubs.filter((s) => s.userId).map((s) => s.userId!)
  const userSettings = userIds.length > 0
    ? await prisma.userSettings.findMany({ where: { userId: { in: userIds } } })
    : []

  const disabledUserIds = new Set(
    userSettings
      .filter((s) => (s as Record<string, unknown>)[prefKey] === false)
      .map((s) => s.userId),
  )

  // Return subs where: guest (no userId) OR user hasn't disabled this pref
  return allSubs.filter((s) => !s.userId || !disabledUserIds.has(s.userId))
}

async function sendPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      { TTL: 3600 },
    )
    return true
  } catch (err: unknown) {
    // Remove expired/invalid subscriptions (410 Gone, 404 Not Found)
    if (err && typeof err === 'object' && 'statusCode' in err) {
      const statusCode = (err as { statusCode: number }).statusCode
      if (statusCode === 410 || statusCode === 404) {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        }).catch(() => {})
      }
    }
    return false
  }
}

export async function sendPushToAll(payload: PushPayload, prefKey: NotifPrefKey): Promise<number> {
  const subs = await getSubscriptionsForPref(prefKey)
  let sent = 0

  await Promise.allSettled(
    subs.map(async (sub) => {
      const ok = await sendPush(sub, payload)
      if (ok) sent++
    }),
  )

  return sent
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  let sent = 0

  await Promise.allSettled(
    subs.map(async (sub) => {
      const ok = await sendPush(sub, payload)
      if (ok) sent++
    }),
  )

  return sent
}

// Signal alert: new BUY/SELL on a watched asset
export async function notifyNewSignal(symbol: string, direction: string, confidence: number): Promise<void> {
  sendPushToAll(
    {
      title: `${direction} Signal: ${symbol}`,
      body: `${direction} signal fired with ${confidence}% confidence`,
      tag: `signal-${symbol}-${direction}`,
      url: `/dashboard?symbol=${symbol}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    },
    'pushSignalAlerts',
  ).catch(() => {})
}

// TP1 hit notification
export async function notifyTpHit(symbol: string, direction: string): Promise<void> {
  sendPushToAll(
    {
      title: `TP1 Hit: ${symbol}`,
      body: `${symbol} ${direction} signal reached take-profit target`,
      tag: `tp-hit-${symbol}`,
      url: '/accuracy',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    },
    'pushTpAlerts',
  ).catch(() => {})
}

// SL hit notification
export async function notifySlHit(symbol: string, direction: string): Promise<void> {
  sendPushToAll(
    {
      title: `SL Hit: ${symbol}`,
      body: `${symbol} ${direction} signal hit stop-loss`,
      tag: `sl-hit-${symbol}`,
      url: '/accuracy',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    },
    'pushSlAlerts',
  ).catch(() => {})
}
