import type { AgentTemplate } from '../types'

export const webScraperTemplate: AgentTemplate = {
  id: 'web-scraper',
  name: 'Web Scraper Agent',
  description: 'Crawls URLs and extracts structured data using AI-powered parsing.',
  useCase: 'Automate competitive research, price monitoring, or content aggregation.',
  tools: ['web-search', 'api-calls'],
  trigger: 'webhook',
  systemPrompt:
    'You are a web scraping agent. Given a URL and a data schema, fetch the page content and extract structured information matching the schema. Return clean JSON.',
  tags: ['research', 'data', 'automation'],
  code: `import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

interface ScrapeRequest {
  url: string
  schema: Record<string, string> // field name -> description
}

export async function scrapeUrl({ url, schema }: ScrapeRequest) {
  // Fetch page content
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const html = await res.text()

  // Strip HTML tags for a clean text representation
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 8000)

  const schemaDesc = Object.entries(schema)
    .map(([k, v]) => \`"\${k}": \${v}\`)
    .join(', ')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: \`Extract the following fields from this page content and return valid JSON only.
Schema: { \${schemaDesc} }

Page content:
\${text}\`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  return JSON.parse(raw)
}

// Example usage
const result = await scrapeUrl({
  url: 'https://example.com/product',
  schema: { title: 'product name', price: 'price in USD', rating: 'star rating' },
})
console.log(result)
`,
}
