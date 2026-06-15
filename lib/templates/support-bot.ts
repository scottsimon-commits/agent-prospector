import type { AgentTemplate } from '../types'

export const supportBotTemplate: AgentTemplate = {
  id: 'support-bot',
  name: 'Customer Support Bot',
  description: 'FAQ-aware support agent that handles common questions and escalates complex issues.',
  useCase: 'Handle tier-1 support automatically, freeing human agents for complex problems.',
  tools: ['database', 'email', 'api-calls'],
  trigger: 'webhook',
  systemPrompt:
    'You are a friendly customer support agent. Answer questions using the provided FAQ knowledge base. For issues you cannot resolve, collect details and escalate to a human agent.',
  tags: ['support', 'customer-service', 'automation'],
  code: `import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// Replace with your actual FAQ data
const FAQ_KNOWLEDGE_BASE = \`
Q: How do I reset my password?
A: Click "Forgot Password" on the login page and follow the email instructions.

Q: What are your business hours?
A: We're available Monday-Friday, 9am-6pm EST.

Q: How do I cancel my subscription?
A: Go to Settings > Billing > Cancel Subscription. Cancellations take effect at period end.

Q: How do I get a refund?
A: Refunds are available within 30 days of purchase. Contact billing@company.com.
\`

interface SupportTicket {
  customerId: string
  customerEmail: string
  message: string
  conversationHistory?: Array<{ role: string; content: string }>
}

interface SupportResponse {
  reply: string
  resolved: boolean
  escalate: boolean
  escalationReason?: string
}

export async function handleSupportTicket(ticket: SupportTicket): Promise<SupportResponse> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: \`You are a helpful customer support agent. Use this FAQ to answer questions:

\${FAQ_KNOWLEDGE_BASE}

Respond with JSON:
{
  "reply": "your response to the customer",
  "resolved": true/false,
  "escalate": true/false,
  "escalationReason": "reason if escalating, otherwise null"
}\`,
    messages: [
      ...(ticket.conversationHistory ?? []),
      { role: 'user', content: ticket.message },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  return JSON.parse(raw)
}

// Example
const response = await handleSupportTicket({
  customerId: 'cust_123',
  customerEmail: 'user@example.com',
  message: 'Hi, I forgot my password and need help getting back in.',
})
console.log(response)
`,
}
