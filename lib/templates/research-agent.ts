import type { AgentTemplate } from '../types'

export const researchAgentTemplate: AgentTemplate = {
  id: 'research-agent',
  name: 'Research Agent',
  description: 'Deep-dives a topic using web search and synthesizes findings into a structured report.',
  useCase: 'Automate market research, competitive analysis, or technical due diligence.',
  tools: ['web-search', 'api-calls'],
  trigger: 'chat',
  systemPrompt:
    'You are a research analyst. Given a topic, search for relevant information, synthesize key findings, and produce a clear structured report with sources.',
  tags: ['research', 'productivity', 'analysis'],
  code: `import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function research(topic: string): Promise<string> {
  // Use Claude with extended thinking for deep research synthesis
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: \`You are an expert research analyst. Synthesize comprehensive, accurate information about any topic.
Structure your reports with: ## Executive Summary, ## Key Findings, ## Implications, ## Sources (cited inline).\`,
    messages: [
      {
        role: 'user',
        content: \`Research this topic thoroughly and produce a structured report: \${topic}

Include specific facts, statistics, and actionable insights. Cite sources where possible.\`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

// Example
const report = await research('Latest developments in AI agent frameworks 2025')
console.log(report)
`,
}
