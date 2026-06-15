import { NextRequest } from 'next/server'
import { getClient, PROSPECT_SYSTEM_PROMPT } from '@/lib/anthropic'
import { ProspectRequestSchema } from '@/lib/validation'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const parsed = ProspectRequestSchema.safeParse(body)
  if (!parsed.success) {
    return new Response(parsed.error.message, { status: 400 })
  }

  let client
  try {
    client = getClient()
  } catch {
    return new Response(
      'ANTHROPIC_API_KEY not configured. Add it to your Vercel environment variables.',
      { status: 503 }
    )
  }

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: PROSPECT_SYSTEM_PROMPT,
    messages: parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
  })

  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
