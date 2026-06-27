import { NextRequest } from 'next/server'
import { BusinessProspectRequestSchema } from '@/lib/validation'

export const runtime = 'edge'

const DIRECTORY_DOMAINS = [
  'google.', 'bing.', 'yahoo.', 'duckduckgo.',
  'yelp.com', 'yellowpages.com', 'whitepages.com', 'angi.com', 'thumbtack.com',
  'bbb.org', 'manta.com', 'bizapedia.com', 'dnb.com', 'hoovers.com',
  'zoominfo.com', 'rocketreach.co', 'apollo.io', 'crunchbase.com',
  'wikipedia.org', 'wikidata.org', 'mapquest.com',
  'jina.ai', 'reddit.com', 'quora.com', 'nextdoor.com',
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com',
  'linkedin.com',
]

const BUSINESS_SUFFIX_WORDS = new Set([
  'inc', 'llc', 'corp', 'co', 'ltd', 'company', 'group',
  'manufacturing', 'mfg', 'industries', 'ind', 'services', 'solutions', 'systems',
])

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
  const text = searchText.replace(/\*+/g, '')
  const labeled = /(?:URL Source:|Source URL:|URL:|Website:|Homepage:)\s*(https?:\/\/[^\s\n]+)/gi
  let match
  while ((match = labeled.exec(text)) !== null) {
    const url = match[1].replace(/[,;.)\]]+$/, '')
    if (!DIRECTORY_DOMAINS.some((d) => url.includes(d))) return url
  }
  const bare = text.match(/https?:\/\/[^\s\n\)]+/g) ?? []
  for (const u of bare) {
    const clean = u.replace(/[,;.)\]]+$/, '')
    if (!DIRECTORY_DOMAINS.some((d) => clean.includes(d))) return clean
  }
  return null
}

function extractLinkedInUrl(searchText: string): string | null {
  const match = searchText.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[^\s\n\)]+/i)
  return match ? match[0].replace(/[,;.)\]]+$/, '') : null
}

// Build likely domain candidates directly from the company name.
// "Esco Manufacturing" → ["https://www.escomanufacturing.com", "https://www.esco.com"]
function buildDomainCandidates(companyName: string): string[] {
  const words = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const full = words.join('')
  const core = words.filter((w) => !BUSINESS_SUFFIX_WORDS.has(w)).join('')

  const seen = new Set<string>()
  const out: string[] = []
  for (const slug of [full, core]) {
    if (slug && slug.length >= 3 && !seen.has(slug)) {
      seen.add(slug)
      out.push(`https://www.${slug}.com`)
    }
  }
  return out
}

// Verify the fetched page belongs to this company (not a random site with same domain pattern)
function contentMatchesCompany(content: string, companyName: string): boolean {
  const keywords = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !BUSINESS_SUFFIX_WORDS.has(w))
  if (keywords.length === 0) return content.length > 500
  const lower = content.toLowerCase()
  const hits = keywords.filter((w) => lower.includes(w)).length
  return hits >= Math.ceil(keywords.length * 0.5)
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

  const generalQuery  = encodeURIComponent(`"${companyName}" ${location}`)
  const linkedInQuery = encodeURIComponent(`"${companyName}" ${location} site:linkedin.com/company`)
  const profileQuery  = encodeURIComponent(`"${companyName}" ${location} employees zoominfo OR "dun bradstreet"`)

  // Domain candidates probed directly — "Esco Manufacturing" → escomanufacturing.com, esco.com
  const domainCandidates = buildDomainCandidates(companyName)

  // Round 1 — all in parallel: 3 searches + up to 2 direct domain probes
  const [generalResults, linkedInResults, profileResults, ...domainContents] = await Promise.all([
    fetchWithTimeout(`https://s.jina.ai/?q=${generalQuery}`,  8000),
    fetchWithTimeout(`https://s.jina.ai/?q=${linkedInQuery}`, 8000),
    fetchWithTimeout(`https://s.jina.ai/?q=${profileQuery}`,  8000),
    ...domainCandidates.map((url) => fetchWithTimeout(`https://r.jina.ai/${url}`, 8000)),
  ])

  // Find website URL: check direct probes first (most reliable), fall back to search results
  let websiteUrl: string | null = null
  let websiteContent: string | null = null

  for (let i = 0; i < domainCandidates.length; i++) {
    const content = domainContents[i] ?? null
    if (content && contentMatchesCompany(content, companyName)) {
      websiteUrl = domainCandidates[i]
      websiteContent = content.slice(0, 3000)
      break
    }
  }

  // Fall back to extracting URL from search results if domain probing didn't find it
  if (!websiteUrl) {
    websiteUrl =
      (generalResults ? extractWebsiteUrl(generalResults) : null) ??
      (profileResults ? extractWebsiteUrl(profileResults) : null)
  }

  const linkedInUrl =
    linkedInResults ? extractLinkedInUrl(linkedInResults) :
    generalResults  ? extractLinkedInUrl(generalResults)  : null

  const crossRef = profileResults ? profileResults.slice(0, 800) : ''
  const searchSnippets = [
    (generalResults ?? '').slice(0, 1000),
    crossRef ? `\n\n--- ZOOMINFO / D&B (employee count & company size) ---\n${crossRef}` : '',
  ].join('').trim()

  // Round 2 — fetch deeper pages + LinkedIn in parallel
  // About/company pages often have employee counts and history that homepages don't
  const base = websiteUrl ? websiteUrl.replace(/\/$/, '') : null
  const aboutPaths = ['/about-us', '/about', '/company', '/our-company', '/our-story']
  const aboutUrls = base ? aboutPaths.map((p) => `${base}${p}`) : []

  const [fetchedWebsite, linkedInContent, ...aboutResults] = await Promise.all([
    websiteUrl && !websiteContent ? fetchWithTimeout(`https://r.jina.ai/${websiteUrl}`, 10000) : Promise.resolve(null),
    linkedInUrl ? fetchWithTimeout(`https://r.jina.ai/${linkedInUrl}`, 12000) : Promise.resolve(null),
    ...aboutUrls.map((u) => fetchWithTimeout(`https://r.jina.ai/${u}`, 8000)),
  ])

  if (fetchedWebsite) websiteContent = fetchedWebsite.slice(0, 2000)

  // Append the first about page that returned meaningful content
  const aboutContent = aboutResults.find((r) => r && r.length > 300) ?? null
  if (aboutContent) {
    const combined = (websiteContent ?? '') + '\n\n--- ABOUT / COMPANY PAGE ---\n' + aboutContent.slice(0, 1500)
    websiteContent = combined.slice(0, 3500)
  }

  return Response.json({
    websiteUrl,
    websiteContent,
    linkedInUrl,
    linkedInContent: linkedInContent ? linkedInContent.slice(0, 1500) : null,
    searchSnippets: searchSnippets.slice(0, 2000),
  })
}
