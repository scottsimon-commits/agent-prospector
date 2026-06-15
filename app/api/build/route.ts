import { NextRequest, NextResponse } from 'next/server'
import { getClient, BUILD_SYSTEM_PROMPT } from '@/lib/anthropic'
import { saveAgent } from '@/lib/registry'
import { BuildRequestSchema } from '@/lib/validation'
import type { Agent } from '@/lib/types'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BuildRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { spec } = parsed.data

  let client
  try {
    client = getClient()
  } catch {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const formatDesc =
    spec.format === 'nextjs-api-route'
      ? 'Next.js 14 App Router API route (TypeScript, export async function POST)'
      : spec.format === 'standalone-node'
      ? 'standalone Node.js TypeScript script with a main() function'
      : 'Claude Agent SDK agent using @anthropic-ai/sdk'

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: BUILD_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a complete ${formatDesc} for this agent:

Name: ${spec.name}
Description: ${spec.description}
Tools: ${spec.tools.join(', ')}
Trigger: ${spec.trigger}
System Prompt: ${spec.systemPrompt}

Use @anthropic-ai/sdk and claude-sonnet-4-6. Include all imports. Make it production-ready.`,
      },
    ],
  })

  const code = message.content[0].type === 'text' ? message.content[0].text : ''
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
