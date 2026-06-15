import { NextRequest, NextResponse } from 'next/server'
import { getOpenRouterClient, getAvailableProvider, PROSPECT_MODEL } from '@/lib/ai-provider'
import { getClient } from '@/lib/anthropic'
import { z } from 'zod'

export const runtime = 'nodejs'

const Schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  tools: z.array(z.string()).max(10),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const provider = getAvailableProvider()
  if (!provider) return NextResponse.json({ error: 'No AI provider' }, { status: 503 })

  const { name, description, tools } = parsed.data

  const userPrompt = `Write a concise, focused system prompt for an AI agent with the following spec:

Name: ${name}
Description: ${description}
Available tools: ${tools.length ? tools.join(', ') : 'none specified'}

Output ONLY the system prompt text — no explanation, no markdown, no quotes. Start directly with "You are..."`

  try {
    let text = ''

    if (provider === 'openrouter') {
      const client = getOpenRouterClient()
      const response = await client.chat.completions.create({
        model: PROSPECT_MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: userPrompt }],
      })
      text = response.choices[0]?.message?.content ?? ''
    } else {
      const anthropic = getClient()
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: userPrompt }],
      })
      text = message.content[0].type === 'text' ? message.content[0].text : ''
    }

    return NextResponse.json({ prompt: text.trim() })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Prompt generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
