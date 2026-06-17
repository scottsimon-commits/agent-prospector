export type AgentTool =
  | 'web-search'
  | 'file-io'
  | 'code-exec'
  | 'api-calls'
  | 'email'
  | 'calendar'
  | 'database'
  | 'github'

export type AgentTrigger = 'webhook' | 'schedule' | 'chat' | 'manual'
export type AgentFormat = 'nextjs-api-route' | 'standalone-node' | 'claude-agent-sdk'
export type AgentStatus = 'draft' | 'deployed' | 'live'

export interface AgentSpec {
  name: string
  description: string
  tools: AgentTool[]
  trigger: AgentTrigger
  systemPrompt: string
  format: AgentFormat
}

export interface Agent {
  id: string
  spec: AgentSpec
  code: string
  status: AgentStatus
  githubUrl?: string
  vercelUrl?: string
  createdAt: string
  updatedAt: string
}

export interface AgentTemplate {
  id: string
  name: string
  description: string
  useCase: string
  tools: AgentTool[]
  trigger: AgentTrigger
  systemPrompt: string
  code: string
  tags: string[]
}

export interface OpportunityCard {
  name: string
  description: string
  tools: AgentTool[]
  estimatedValue: string
  complexity: 'low' | 'medium' | 'high'
}

export interface DeployResult {
  success: boolean
  githubUrl?: string
  vercelUrl?: string
  error?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BusinessCompanyProfile {
  name: string
  industry: string
  businessType: string
  estimatedSize: string
  primaryOperations: string[]
  keyPainPoints: string[]
  technologyProfile: string
}

export type RecommendationTier = 'primary' | 'expansion'

export interface AgentRecommendation {
  rank: number
  tier: RecommendationTier
  name: string
  tagline: string
  description: string
  whyThisCompany: string
  impact: string
  tools: string[]
  complexity: 'low' | 'medium' | 'high'
  implementationTime: string
  category: string
}

export interface BusinessProspectResult {
  company: BusinessCompanyProfile
  recommendations: AgentRecommendation[]
  websiteUrl?: string
  linkedInUrl?: string
}
