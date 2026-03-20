import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/app/lib/apiGuard'

interface TelegramSendBody {
  botToken: string
  chatId: string
  message: string
}

export async function POST(request: Request): Promise<Response> {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = (await request.json()) as TelegramSendBody

    if (!body.botToken || !body.chatId || !body.message) {
      return NextResponse.json(
        { error: 'Missing botToken, chatId, or message' },
        { status: 400 },
      )
    }

    // Sanitize inputs
    const token = body.botToken.trim()
    const chatId = body.chatId.trim()
    const message = body.message.slice(0, 4096) // Telegram max message length

    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        { error: data.description || `Telegram API error ${res.status}` },
        { status: res.status },
      )
    }

    return NextResponse.json({ success: true, messageId: data.result?.message_id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
