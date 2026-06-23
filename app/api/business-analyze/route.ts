import { NextRequest } from 'next/server'
import {
  getOpenRouterClient,
  getAvailableProvider,
  BUSINESS_PROSPECT_MODEL,
  BUSINESS_PROSPECT_FALLBACK_MODEL,
  BUSINESS_PROSPECT_SYSTEM_PROMPT,
} from '@/lib/ai-provider'
import { BusinessAnalyzeRequestSchema } from '@/lib/validation'

export const runtime = 'edge'

function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim()
}

function buildResearchBrief(research: {
  websiteUrl: string | null
  websiteContent: string | null
  linkedInUrl: string | null
  linkedInContent: string | null
  searchSnippets: string
}): string {
  const sections: string[] = []

  if (research.websiteContent) {
    sections.push(`=== COMPANY WEBSITE (${research.websiteUrl}) — PRIMARY SOURCE ===\n${research.websiteContent}`)
  } else if (research.websiteUrl) {
    sections.push(`=== COMPANY WEBSITE ===\nFound at ${research.websiteUrl} but content could not be fetched.`)
  } else {
    sections.push('=== COMPANY WEBSITE ===\nNo website found — base analysis on company name, location, and industry knowledge.')
  }

  if (research.linkedInContent) {
    sections.push(`=== LINKEDIN PROFILE (${research.linkedInUrl}) ===\n${research.linkedInContent}`)
  } else if (research.linkedInUrl) {
    sections.push(`=== LINKEDIN PROFILE ===\nFound at ${research.linkedInUrl} but content could not be fetched.`)
  }

  if (research.searchSnippets) {
    sections.push(`=== WEB SEARCH RESULTS (general context & third-party info) ===\n${research.searchSnippets}`)
  }

  return sections.join('\n\n')
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const parsed = BusinessAnalyzeRequestSchema.safeParse(body)
  if (!parsed.success) return new Response(parsed.error.message, { status: 400 })

  const provider = getAvailableProvider()
  if (!provider) {
    return new Response('No AI provider configured. Add OPENROUTER_API_KEY to environment variables.', {
      status: 503,
    })
  }

  const { companyName, location, context, research } = parsed.data
  const researchBrief = buildResearchBrief(research)

  const userMessage = `Analyze this company and generate exactly 7 ranked AI agent recommendations.

Company Name: ${companyName}
Location: ${location}${context ? `\nAdditional context: ${context}` : ''}

${researchBrief}

Prioritize the website content as your primary source. Use LinkedIn for team/company size details. Use search results for supplementary context. Return the complete JSON response only.`

  try {
    const client = getOpenRouterClient()

    let response
    try {
      response = await client.chat.completions.create({
        model: BUSINESS_PROSPECT_MODEL,
        stream: false,
        max_tokens: 2000,
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
          max_tokens: 2000,
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

    data.websiteUrl = research.websiteUrl ?? null
    data.linkedInUrl = research.linkedInUrl ?? null

    return Response.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI provider error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
