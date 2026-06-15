import type { AgentTemplate } from '../types'

export const emailProcessorTemplate: AgentTemplate = {
  id: 'email-processor',
  name: 'Email Processor Agent',
  description: 'Triages incoming emails by priority, extracts action items, and drafts replies.',
  useCase: 'Cut inbox zero time in half by automating triage and draft generation.',
  tools: ['email', 'api-calls'],
  trigger: 'webhook',
  systemPrompt:
    'You are an executive assistant. Analyze incoming emails, classify their priority, extract action items, and draft professional replies when appropriate.',
  tags: ['email', 'productivity', 'automation'],
  code: `import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

interface Email {
  from: string
  subject: string
  body: string
  receivedAt: string
}

interface ProcessedEmail {
  priority: 'urgent' | 'high' | 'normal' | 'low'
  summary: string
  actionItems: string[]
  draftReply: string | null
  labels: string[]
}

export async function processEmail(email: Email): Promise<ProcessedEmail> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: \`You are an executive assistant AI that processes emails.
Respond only with valid JSON matching this schema:
{
  "priority": "urgent" | "high" | "normal" | "low",
  "summary": "one sentence summary",
  "actionItems": ["item1", "item2"],
  "draftReply": "draft reply text or null if no reply needed",
  "labels": ["label1", "label2"]
}\`,
    messages: [
      {
        role: 'user',
        content: \`Process this email:
From: \${email.from}
Subject: \${email.subject}
Received: \${email.receivedAt}

\${email.body}\`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  return JSON.parse(raw)
}

// Example
const result = await processEmail({
  from: 'ceo@company.com',
  subject: 'Q4 budget approval needed by EOD',
  body: 'Please review and approve the attached Q4 budget proposal before end of day.',
  receivedAt: new Date().toISOString(),
})
console.log(result)
`,
}
