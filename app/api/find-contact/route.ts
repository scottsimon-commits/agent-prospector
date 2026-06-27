import { NextRequest } from 'next/server'
import { getGroqClient, GROQ_MODEL, GROQ_FALLBACK_MODEL } from '@/lib/ai-provider'

export const runtime = 'edge'

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

function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim()
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { companyName, location, websiteUrl } = body as {
    companyName: string
    location: string
    websiteUrl?: string | null
  }

  if (!companyName || !location) {
    return new Response('companyName and location are required', { status: 400 })
  }

  // Run targeted leadership searches + leadership page fetches in parallel
  const q1 = encodeURIComponent(`"${companyName}" ${location} president CEO owner founder`)
  const q2 = encodeURIComponent(`"${companyName}" ${location} SBA award OR "chamber of commerce" OR "business of the year" OR "press release"`)
  const q3 = encodeURIComponent(`"${companyName}" ${location} "vice president" OR "director" OR "chief" OR leadership team`)

  const base = websiteUrl ? websiteUrl.replace(/\/$/, '') : null
  const leadershipPaths = ['/about-us', '/team', '/leadership']
  const leadershipUrls = base ? leadershipPaths.map(p => `${base}${p}`) : []

  const [search1, search2, search3, ...pageResults] = await Promise.all([
    fetchWithTimeout(`https://s.jina.ai/?q=${q1}`, 8000),
    fetchWithTimeout(`https://s.jina.ai/?q=${q2}`, 8000),
    fetchWithTimeout(`https://s.jina.ai/?q=${q3}`, 8000),
    ...leadershipUrls.map(u => fetchWithTimeout(`https://r.jina.ai/${u}`, 6000)),
  ])

  // Combine all gathered data
  const sections: string[] = []
  if (search1) sections.push(`=== WEB SEARCH: General Leadership ===\n${search1.slice(0, 1200)}`)
  if (search2) sections.push(`=== WEB SEARCH: Awards & Press ===\n${search2.slice(0, 1000)}`)
  if (search3) sections.push(`=== WEB SEARCH: Management Titles ===\n${search3.slice(0, 1000)}`)

  const leadershipPageContent = pageResults.find(r => r && r.length > 200) ?? null
  if (leadershipPageContent) {
    sections.push(`=== COMPANY WEBSITE — TEAM/LEADERSHIP PAGE ===\n${leadershipPageContent.slice(0, 1500)}`)
  }

  if (sections.length === 0) {
    return Response.json({ contacts: [], message: 'No data found for this company.' })
  }

  const gathered = sections.join('\n\n')

  const systemPrompt = `You are an expert at extracting current business leadership contacts from web research data.

Your job is to identify named individuals who currently hold leadership or decision-making roles at the specified company.

RULES:
- Only include people with a clear name AND a clear title/role
- Prioritize: Owner, President, CEO, COO, CFO, CIO, VP, Director, General Manager, Branch Manager
- Confidence HIGH: found on company website, SBA record, government source, or official press release
- Confidence MEDIUM: found on third-party site (ZoomInfo snippet, industry publication, chamber listing)
- Skip generic mentions with no title, testimonial authors, and sales contacts
- If the same person appears in multiple sources, list them once with the highest confidence
- If no clear leadership contacts are found, return an empty contacts array

ALWAYS populate the "intelligence" field with a concise summary of everything useful found:
- Any names mentioned (even without confirmed titles)
- Company size, revenue, employee count if found
- HQ location if different from the searched location
- Ownership structure (family-owned, private equity, franchise, etc.)
- Number of locations if multi-site
- Any other context useful for a sales outreach decision

Return ONLY valid JSON, no explanation:
{
  "contacts": [
    {
      "name": "Full Name",
      "title": "Their Title",
      "source": "Where this was found (e.g. Company website, SBA award, ZoomInfo)",
      "confidence": "HIGH" | "MEDIUM"
    }
  ],
  "intelligence": "Always populated — a 3-5 sentence summary of what the research found about this company and its leadership, even if no clean contacts were extracted.",
  "notes": "Optional 1-sentence observation about data quality or gaps"
}`

  const userMessage = `Company: ${companyName}
Location: ${location}

Research data gathered:
${gathered}`

  try {
    const groq = getGroqClient()
    let response
    try {
      response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        stream: false,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('429') || msg.includes('rate')) {
        response = await groq.chat.completions.create({
          model: GROQ_FALLBACK_MODEL,
          stream: false,
          max_tokens: 1000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        })
      } else {
        throw e
      }
    }

    const content = response.choices[0]?.message?.content ?? ''
    const parsed = JSON.parse(stripJsonFences(content))
    return Response.json(parsed)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Contact search failed'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
