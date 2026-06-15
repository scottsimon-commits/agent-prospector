import { NextRequest } from 'next/server'
import { getOpenRouterClient, getAvailableProvider, PROSPECT_MODEL, PROSPECT_SYSTEM_PROMPT } from '@/lib/ai-provider'
import { getClient } from '@/lib/anthropic'
import { ProspectRequestSchema } from '@/lib/validation'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Normalize any provider stream to simple: data: {"text":"..."}\n\ndata: [DONE]\n\n
function makeTextEncoder() {
  return new TextEncoder()
}

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getClientIp(req), 20, 60_000)
  if (!allowed) {
    return new Response('Rate limit exceeded. Try again in a minute.', {
      status: 429,
      headers: { 'Retry-After': '60' },
    })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const parsed = ProspectRequestSchema.safeParse(body)
  if (!parsed.success) return new Response(parsed.error.message, { status: 400 })

  const provider = getAvailableProvider()
  if (!provider) {
    return new Response(
      'No AI provider configured. Add OPENROUTER_API_KEY or ANTHROPIC_API_KEY to environment variables.',
      { status: 503 }
    )
  }

  const encoder = makeTextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
      }

      try {
        if (provider === 'openrouter') {
          const client = getOpenRouterClient()
          const openRouterStream = await client.chat.completions.create({
            model: PROSPECT_MODEL,
            stream: true,
            max_tokens: 2048,
            messages: [
              { role: 'system', content: PROSPECT_SYSTEM_PROMPT },
              ...parsed.data.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            ],
          })
          for await (const chunk of openRouterStream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) send(text)
          }
        } else {
          // Anthropic fallback
          const anthropic = getClient()
          const anthropicStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: PROSPECT_SYSTEM_PROMPT,
            messages: parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
          })
          for await (const event of anthropicStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              send(event.delta.text)
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI provider error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
