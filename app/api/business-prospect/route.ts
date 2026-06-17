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

// Domains to skip when picking a company's "official" website from search results
const SKIP_DOMAINS = [
  'google.', 'bing.', 'yahoo.', 'duckduckgo.',
  'yelp.com', 'yellowpages.com', 'whitepages.com', 'angi.com', 'thumbtack.com',
  'bbb.org', 'manta.com', 'bizapedia.com', 'dnb.com', 'hoovers.com',
  'wikipedia.org', 'wikidata.org', 'mapquest.com', 'maps.google.',
  'jina.ai', 'reddit.com', 'quora.com',
]

function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim()
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'text/plain,text/html,*/*' },
    })
  } finally {
    clearTimeout(timer)
  }
}

async function searchForWebsite(companyName: string, location: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`"${companyName}" ${location} official website`)
    const res = await fetchWithTimeout(`https://s.jina.ai/?q=${query}`, 6000)
    if (!res.ok) return null
    const text = await res.text()

    // Jina search returns "URL Source: https://..." lines
    const urlPattern = /(?:URL Source:|URL:)\s*(https?:\/\/[^\s\n]+)/gi
    let match
    while ((match = urlPattern.exec(text)) !== null) {
      const url = match[1].replace(/[,;.]+$/, '') // strip trailing punctuation
      if (!SKIP_DOMAINS.some((d) => url.includes(d))) {
        return url
      }
    }

    // Fallback: any https:// URL that isn't a skipped domain
    const fallback = text.match(/https?:\/\/[^\s\n\)]+/g) ?? []
    for (const url of fallback) {
      const clean = url.replace(/[,;.]+$/, '')
      if (!SKIP_DOMAINS.some((d) => clean.includes(d))) return clean
    }

    return null
  } catch {
    return null
  }
}

async function fetchWebsiteContent(url: string): Promise<string | null> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`
    const res = await fetchWithTimeout(jinaUrl, 8000)
    if (!res.ok) return null
    const text = await res.text()
    // Truncate to keep within context limits — homepage is usually enough
    return text.slice(0, 5000)
  } catch {
    return null
  }
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

  // Step 1: Search for the company website
  const websiteUrl = await searchForWebsite(companyName, location)

  // Step 2: Fetch website content if found
  let websiteContent: string | null = null
  if (websiteUrl) {
    websiteContent = await fetchWebsiteContent(websiteUrl)
  }

  // Build user message — lean on real website data when available
  const websiteSection = websiteContent
    ? `\n\nWEBSITE CONTENT (from ${websiteUrl}):\n${websiteContent}\n\nUse this real website content as your PRIMARY source. Extract actual services, team info, locations, and any details mentioned.`
    : websiteUrl
    ? `\n\nWebsite found (${websiteUrl}) but content could not be fetched. Use your knowledge of this business type.`
    : `\n\nNo website was found. Base your analysis on what is typical for this type of business in this location.`

  const userMessage = `Research this company and generate 7 ranked AI agent recommendations:

Company Name: ${companyName}
Location: ${location}${context ? `\nAdditional context: ${context}` : ''}${websiteSection}

Return the complete JSON response now.`

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

    // Attach the website URL so the frontend can display it
    data.websiteUrl = websiteUrl ?? null

    return Response.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI provider error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
