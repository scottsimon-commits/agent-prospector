import { NextRequest } from 'next/server'
import { getOpenRouterClient, getAvailableProvider, PROSPECT_MODEL, PROSPECT_FALLBACK_MODEL, PROSPECT_SYSTEM_PROMPT } from '@/lib/ai-provider'
import { ProspectRequestSchema } from '@/lib/validation'

// Edge runtime: 30s timeout on Hobby plan vs 10s for Node.js
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const parsed = ProspectRequestSchema.safeParse(body)
  if (!parsed.success) return new Response(parsed.error.message, { status: 400 })

  const provider = getAvailableProvider()
  if (!provider) {
    return new Response(
      'No AI provider configured. Add OPENROUTER_API_KEY to environment variables.',
      { status: 503 }
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
      }

      try {
        const client = getOpenRouterClient()
        const msgs = [
          { role: 'system' as const, content: PROSPECT_SYSTEM_PROMPT },
          ...parsed.data.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ]

        // Try primary model, fall back on upstream 429
        let openRouterStream
        try {
          openRouterStream = await client.chat.completions.create({
            model: PROSPECT_MODEL,
            stream: true,
            max_tokens: 2048,
            messages: msgs,
          })
        } catch (e) {
          const msg = e instanceof Error ? e.message : ''
          if (msg.includes('429') || msg.includes('rate-limited') || msg.includes('503')) {
            openRouterStream = await client.chat.completions.create({
              model: PROSPECT_FALLBACK_MODEL,
              stream: true,
              max_tokens: 2048,
              messages: msgs,
            })
          } else {
            throw e
          }
        }

        for await (const chunk of openRouterStream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) send(text)
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
