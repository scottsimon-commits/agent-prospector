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

// Hard cap on all web research — guarantees the AI call has ≥20s within the 30s edge limit
const RESEARCH_TIMEOUT_MS = 8000

// Domains that are NOT the company's own website
const DIRECTORY_DOMAINS = [
  'google.', 'bing.', 'yahoo.', 'duckduckgo.',
  'yelp.com', 'yellowpages.com', 'whitepages.com', 'angi.com', 'thumbtack.com',
  'bbb.org', 'manta.com', 'bizapedia.com', 'dnb.com', 'hoovers.com',
  'wikipedia.org', 'wikidata.org', 'mapquest.com',
  'jina.ai', 'reddit.com', 'quora.com', 'nextdoor.com',
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com',
  'linkedin.com', // handled separately
]

interface ResearchData {
  websiteUrl: string | null
  websiteContent: string | null
  linkedInUrl: string | null
  linkedInContent: string | null
  searchSnippets: string
}

const EMPTY_RESEARCH: ResearchData = {
  websiteUrl: null,
  websiteContent: null,
  linkedInUrl: null,
  linkedInContent: null,
  searchSnippets: '',
}

function stripJsonFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim()
}

async function fetchWithTimeout(url: string, ms: number): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/plain,text/html,*/*' },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function extractWebsiteUrl(searchText: string): string | null {
  const urlPattern = /(?:URL Source:|URL:)\s*(https?:\/\/[^\s\n]+)/gi
  let match
  while ((match = urlPattern.exec(searchText)) !== null) {
    const url = match[1].replace(/[,;.)\]]+$/, '')
    if (!DIRECTORY_DOMAINS.some((d) => url.includes(d))) return url
  }
  const all = searchText.match(/https?:\/\/[^\s\n\)]+/g) ?? []
  for (const u of all) {
    const clean = u.replace(/[,;.)\]]+$/, '')
    if (!DIRECTORY_DOMAINS.some((d) => clean.includes(d))) return clean
  }
  return null
}

function extractLinkedInUrl(searchText: string): string | null {
  const match = searchText.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[^\s\n\)]+/i)
  return match ? match[0].replace(/[,;.)\]]+$/, '') : null
}

function extractSearchSnippets(searchText: string): string {
  return searchText.slice(0, 2000).trim()
}

async function researchCompany(companyName: string, location: string): Promise<ResearchData> {
  // Two searches in parallel: general (finds website) + LinkedIn-specific
  const generalQuery = encodeURIComponent(`"${companyName}" ${location}`)
  const linkedInQuery = encodeURIComponent(`"${companyName}" ${location} site:linkedin.com/company`)

  const [generalResults, linkedInResults] = await Promise.all([
    fetchWithTimeout(`https://s.jina.ai/?q=${generalQuery}`, 4000),
    fetchWithTimeout(`https://s.jina.ai/?q=${linkedInQuery}`, 4000),
  ])

  const websiteUrl = generalResults ? extractWebsiteUrl(generalResults) : null
  const linkedInUrl =
    linkedInResults ? extractLinkedInUrl(linkedInResults) :
    generalResults  ? extractLinkedInUrl(generalResults) : null
  const searchSnippets = generalResults ? extractSearchSnippets(generalResults) : ''

  // Fetch website + LinkedIn content in parallel
  const [websiteContent, linkedInContent] = await Promise.all([
    websiteUrl ? fetchWithTimeout(`https://r.jina.ai/${websiteUrl}`, 5000) : Promise.resolve(null),
    linkedInUrl ? fetchWithTimeout(`https://r.jina.ai/${linkedInUrl}`, 5000) : Promise.resolve(null),
  ])

  return {
    websiteUrl,
    websiteContent: websiteContent ? websiteContent.slice(0, 4000) : null,
    linkedInUrl,
    linkedInContent: linkedInContent ? linkedInContent.slice(0, 2000) : null,
    searchSnippets,
  }
}

function buildResearchBrief(data: ResearchData): string {
  const sections: string[] = []

  if (data.websiteContent) {
    sections.push(`=== COMPANY WEBSITE (${data.websiteUrl}) — PRIMARY SOURCE ===\n${data.websiteContent}`)
  } else if (data.websiteUrl) {
    sections.push(`=== COMPANY WEBSITE ===\nFound at ${data.websiteUrl} but content could not be fetched.`)
  } else {
    sections.push('=== COMPANY WEBSITE ===\nNo website found.')
  }

  if (data.linkedInContent) {
    sections.push(`=== LINKEDIN PROFILE (${data.linkedInUrl}) ===\n${data.linkedInContent}`)
  } else if (data.linkedInUrl) {
    sections.push(`=== LINKEDIN PROFILE ===\nFound at ${data.linkedInUrl} but content could not be fetched.`)
  }

  if (data.searchSnippets) {
    sections.push(`=== WEB SEARCH RESULTS (general context) ===\n${data.searchSnippets}`)
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

  const parsed = BusinessProspectRequestSchema.safeParse(body)
  if (!parsed.success) return new Response(parsed.error.message, { status: 400 })

  const provider = getAvailableProvider()
  if (!provider) {
    return new Response('No AI provider configured. Add OPENROUTER_API_KEY to environment variables.', {
      status: 503,
    })
  }

  const { companyName, location, context } = parsed.data

  // Race research against a hard timeout — guarantees AI always has ≥20s
  const research = await Promise.race([
    researchCompany(companyName, location),
    new Promise<ResearchData>((resolve) =>
      setTimeout(() => resolve(EMPTY_RESEARCH), RESEARCH_TIMEOUT_MS)
    ),
  ])

  const researchBrief = buildResearchBrief(research)

  const userMessage = `Research this company and generate 7 ranked AI agent recommendations.

Company Name: ${companyName}
Location: ${location}${context ? `\nAdditional context: ${context}` : ''}

${researchBrief}

Use the website content as the primary source. Supplement with LinkedIn and search results where the website lacks detail. Return the complete JSON response.`

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
