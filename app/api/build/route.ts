import { NextRequest, NextResponse } from 'next/server'
import { getOpenRouterClient, getAvailableProvider, BUILD_MODEL, BUILD_SYSTEM_PROMPT } from '@/lib/ai-provider'
import { getClient } from '@/lib/anthropic'
import { saveAgent } from '@/lib/registry'
import { BuildRequestSchema } from '@/lib/validation'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import type { Agent } from '@/lib/types'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getClientIp(req), 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BuildRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const provider = getAvailableProvider()
  if (!provider) {
    return NextResponse.json(
      { error: 'No AI provider configured. Add OPENROUTER_API_KEY or ANTHROPIC_API_KEY.' },
      { status: 503 }
    )
  }

  const { spec } = parsed.data
  const formatDesc =
    spec.format === 'nextjs-api-route'
      ? 'Next.js 14 App Router API route (TypeScript, export async function POST)'
      : spec.format === 'standalone-node'
      ? 'standalone Node.js TypeScript script with a main() async function'
      : 'Claude Agent SDK agent using @anthropic-ai/sdk'

  const userPrompt = `Generate a complete ${formatDesc} for this AI agent:

Name: ${spec.name}
Description: ${spec.description}
Tools needed: ${spec.tools.join(', ')}
Trigger type: ${spec.trigger}
System prompt for the agent: ${spec.systemPrompt}

Requirements:
- Use @anthropic-ai/sdk with model claude-sonnet-4-6
- Include all necessary imports
- Add proper error handling
- Make it production-ready and immediately runnable
- Output ONLY the TypeScript code, no markdown or explanation`

  let code = ''

  try {
    if (provider === 'openrouter') {
      const client = getOpenRouterClient()
      const response = await client.chat.completions.create({
        model: BUILD_MODEL,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: BUILD_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      })
      code = response.choices[0]?.message?.content ?? ''
    } else {
      const anthropic = getClient()
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: BUILD_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      })
      code = message.content[0].type === 'text' ? message.content[0].text : ''
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Code generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const now = new Date().toISOString()
  const agent: Agent = {
    id: randomUUID(),
    spec,
    code,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  }

  saveAgent(agent)
  return NextResponse.json(agent)
}
