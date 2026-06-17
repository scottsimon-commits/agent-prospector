import { NextRequest } from 'next/server'
import {
  getOpenRouterClient,
  getAvailableProvider,
  BUSINESS_PROSPECT_MODEL,
  BUSINESS_PROSPECT_FALLBACK_MODEL,
  BUSINESS_PROSPECT_SYSTEM_PROMPT,
} from '@/lib/ai-provider'
import { BusinessProspectRequestSchema } from '@/lib/validation'

export const runtime = 'edge'

function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim()
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const parsed = BusinessProspectRequestSchema.safeParse(body)
  if (!parsed.success) return new Response(parsed.error.message, { status: 400 })

  const provider = getAvailableProvider()
  if (!provider) {
    return new Response('No AI provider configured. Add OPENROUTER_API_KEY to environment variables.', {
      status: 503,
    })
  }

  const { companyName, location, context } = parsed.data

  const userMessage = `Research this company and generate 7 ranked AI agent recommendations:

Company Name: ${companyName}
Location: ${location}${context ? `\nAdditional context: ${context}` : ''}

Analyze this business thoroughly and return the complete JSON response.`

  try {
    const client = getOpenRouterClient()

    let response
    try {
      response = await client.chat.completions.create({
        model: BUSINESS_PROSPECT_MODEL,
        stream: false,
        max_tokens: 3500,
        messages: [
          { role: 'system', content: BUSINESS_PROSPECT_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('429') || msg.includes('rate-limited') || msg.includes('503')) {
        response = await client.chat.completions.create({
          model: BUSINESS_PROSPECT_FALLBACK_MODEL,
          stream: false,
          max_tokens: 3500,
          messages: [
            { role: 'system', content: BUSINESS_PROSPECT_SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
        })
      } else {
        throw e
      }
    }

    const content = response.choices[0]?.message?.content ?? ''
    const jsonStr = stripJsonFences(content)
    const data = JSON.parse(jsonStr)

    return Response.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI provider error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
