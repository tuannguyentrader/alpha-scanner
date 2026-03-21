/* ── Webhook Dispatcher ───────────────────────────────────────────────────── */
// Sends signal payloads to configured webhook URLs with 3x retry + backoff.

import { prisma } from './prisma'

interface SignalPayload {
  symbol: string
  direction: string
  entryPrice: number
  tp1: number
  sl: number
  confidence: number
  timestamp: string
  mode: string
}

async function sendWithRetry(
  url: string,
  payload: SignalPayload,
  webhookId: string,
  maxRetries = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AlphaScanner-Webhook/1.0',
          'X-Webhook-Event': 'signal.new',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      await prisma.webhookLog.create({
        data: {
          webhookId,
          symbol: payload.symbol,
          direction: payload.direction,
          statusCode: res.status,
          success: res.ok,
          attempt,
          error: res.ok ? null : `HTTP ${res.status}`,
        },
      })

      if (res.ok) return
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'

      await prisma.webhookLog.create({
        data: {
          webhookId,
          symbol: payload.symbol,
          direction: payload.direction,
          statusCode: null,
          success: false,
          attempt,
          error: errorMsg,
        },
      }).catch(() => {})

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt - 1) * 1000))
      }
    }
  }
}

export async function dispatchWebhooks(payload: SignalPayload): Promise<void> {
  try {
    const webhooks = await prisma.webhookConfig.findMany({
      where: { enabled: true },
    })

    if (webhooks.length === 0) return

    // Fire all webhooks in parallel (fire-and-forget from caller's perspective)
    await Promise.allSettled(
      webhooks.map((wh) => sendWithRetry(wh.url, payload, wh.id)),
    )
  } catch {
    // Never crash the main signal flow
  }
}
