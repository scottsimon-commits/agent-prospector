import { z } from 'zod'

export const AgentToolSchema = z.enum([
  'web-search', 'file-io', 'code-exec', 'api-calls', 'email', 'calendar', 'database', 'github',
])

export const AgentSpecSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  tools: z.array(AgentToolSchema).max(8),
  trigger: z.enum(['webhook', 'schedule', 'chat', 'manual']),
  systemPrompt: z.string().min(1).max(2000),
  format: z.enum(['nextjs-api-route', 'standalone-node', 'claude-agent-sdk']),
})

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(10000),
})

export const ProspectRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).max(50),
})

export const BuildRequestSchema = z.object({
  spec: AgentSpecSchema,
})

export const DeployRequestSchema = z.object({
  agentId: z.string().uuid(),
  repoName: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Repo name must be lowercase alphanumeric with hyphens'),
})

export const DeleteAgentSchema = z.object({
  id: z.string().uuid(),
})

export const BusinessProspectRequestSchema = z.object({
  companyName: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  context: z.string().max(500).optional(),
})
