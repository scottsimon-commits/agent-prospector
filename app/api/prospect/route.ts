import { NextRequest } from 'next/server'
import { getClient, PROSPECT_SYSTEM_PROMPT } from '@/lib/anthropic'
import type { ChatMessage } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { messages }: { messages: ChatMessage[] } = await req.json()

  let client
  try {
    client = getClient()
  } catch {
    return new Response(
      'ANTHROPIC_API_KEY not configured. Add it to .env.local to enable the Prospector.',
      { status: 503 }
    )
  }

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: PROSPECT_SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
