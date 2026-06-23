import { NextRequest } from 'next/server'
import { BusinessProspectRequestSchema } from '@/lib/validation'

export const runtime = 'edge'

const DIRECTORY_DOMAINS = [
  'google.', 'bing.', 'yahoo.', 'duckduckgo.',
  'yelp.com', 'yellowpages.com', 'whitepages.com', 'angi.com', 'thumbtack.com',
  'bbb.org', 'manta.com', 'bizapedia.com', 'dnb.com', 'hoovers.com',
  'wikipedia.org', 'wikidata.org', 'mapquest.com',
  'jina.ai', 'reddit.com', 'quora.com', 'nextdoor.com',
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com',
  'linkedin.com',
]

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

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const parsed = BusinessProspectRequestSchema.safeParse(body)
  if (!parsed.success) return new Response(parsed.error.message, { status: 400 })

  const { companyName, location } = parsed.data

  // Round 1 — two searches in parallel (generous 8s timeout each)
  const generalQuery = encodeURIComponent(`"${companyName}" ${location}`)
  const linkedInQuery = encodeURIComponent(`"${companyName}" ${location} site:linkedin.com/company`)

  const [generalResults, linkedInResults] = await Promise.all([
    fetchWithTimeout(`https://s.jina.ai/?q=${generalQuery}`, 8000),
    fetchWithTimeout(`https://s.jina.ai/?q=${linkedInQuery}`, 8000),
  ])

  const websiteUrl = generalResults ? extractWebsiteUrl(generalResults) : null
  const linkedInUrl =
    linkedInResults ? extractLinkedInUrl(linkedInResults) :
    generalResults  ? extractLinkedInUrl(generalResults) : null
  const searchSnippets = (generalResults ?? '').slice(0, 2500)

  // Round 2 — fetch full content in parallel (generous 12s timeout each)
  const [websiteContent, linkedInContent] = await Promise.all([
    websiteUrl  ? fetchWithTimeout(`https://r.jina.ai/${websiteUrl}`, 12000)  : Promise.resolve(null),
    linkedInUrl ? fetchWithTimeout(`https://r.jina.ai/${linkedInUrl}`, 12000) : Promise.resolve(null),
  ])

  return Response.json({
    websiteUrl,
    websiteContent: websiteContent ? websiteContent.slice(0, 3000) : null,
    linkedInUrl,
    linkedInContent: linkedInContent ? linkedInContent.slice(0, 1500) : null,
    searchSnippets: searchSnippets.slice(0, 1500),
  })
}
