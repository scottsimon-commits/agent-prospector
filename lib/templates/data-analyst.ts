import type { AgentTemplate } from '../types'

export const dataAnalystTemplate: AgentTemplate = {
  id: 'data-analyst',
  name: 'Data Analyst Agent',
  description: 'Loads CSV or JSON data, runs natural-language analysis, and generates insight reports.',
  useCase: 'Ask questions about your data in plain English and get structured answers.',
  tools: ['file-io', 'code-exec', 'api-calls'],
  trigger: 'chat',
  systemPrompt:
    'You are a data analyst. Given data and a question, analyze the data, compute statistics, identify trends, and produce clear findings with recommendations.',
  tags: ['data', 'analytics', 'reporting'],
  code: `import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'

const client = new Anthropic()

interface AnalysisRequest {
  dataPath: string  // path to CSV or JSON file
  question: string
}

export async function analyzeData({ dataPath, question }: AnalysisRequest): Promise<string> {
  const raw = fs.readFileSync(dataPath, 'utf-8')
  const preview = raw.slice(0, 6000) // first 6k chars as context

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: \`You are an expert data analyst. Analyze the provided data to answer the user's question.
Structure your response with: ## Answer, ## Key Statistics, ## Trends, ## Recommendations.\`,
    messages: [
      {
        role: 'user',
        content: \`Data file (\${dataPath}):
\${preview}

Question: \${question}\`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

// Example
const analysis = await analyzeData({
  dataPath: './sales.csv',
  question: 'Which product category had the highest growth in Q3 vs Q2?',
})
console.log(analysis)
`,
}
