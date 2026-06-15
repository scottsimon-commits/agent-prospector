import type { AgentTemplate } from '../types'

export const codeReviewerTemplate: AgentTemplate = {
  id: 'code-reviewer',
  name: 'Code Reviewer Agent',
  description: 'Reviews GitHub pull requests and posts structured feedback as comments.',
  useCase: 'Automate first-pass code review: catch bugs, style issues, and security problems.',
  tools: ['github', 'api-calls'],
  trigger: 'webhook',
  systemPrompt:
    'You are an expert code reviewer. Analyze the provided diff and identify: bugs, security vulnerabilities, performance issues, and style improvements. Be concise and actionable.',
  tags: ['github', 'devtools', 'code-quality'],
  code: `import Anthropic from '@anthropic-ai/sdk'
import { Octokit } from 'octokit'

const client = new Anthropic()
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

interface ReviewRequest {
  owner: string
  repo: string
  pull_number: number
}

export async function reviewPullRequest({ owner, repo, pull_number }: ReviewRequest) {
  // Fetch the PR diff
  const { data: files } = await octokit.rest.pulls.listFiles({ owner, repo, pull_number })

  const diffSummary = files
    .map((f) => \`### \${f.filename}\\n\${f.patch ?? '(binary file)'}\`)
    .join('\\n\\n')
    .slice(0, 10000)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: \`Review this pull request diff and provide structured feedback.
Format your response as markdown with sections: ## Bugs, ## Security, ## Performance, ## Style.
Keep each finding to 1-2 sentences with a line reference where possible.

\${diffSummary}\`,
      },
    ],
  })

  const review = message.content[0].type === 'text' ? message.content[0].text : 'No review generated.'

  // Post review comment to GitHub
  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number,
    body: \`## 🤖 Agent Prospector Code Review\\n\\n\${review}\`,
    event: 'COMMENT',
  })

  return review
}
`,
}
