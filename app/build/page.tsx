import type { Metadata } from 'next'
import AgentBuilder from '@/components/AgentBuilder'
import { Wrench } from 'lucide-react'
import type { AgentTool } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Build',
  description: 'Generate production-ready AI agent code in 3 steps',
}

interface BuildPageProps {
  searchParams: Promise<{ name?: string; desc?: string; tools?: string }>
}

export default async function BuildPage({ searchParams }: BuildPageProps) {
  const params = await searchParams
  const tools = params.tools ? (params.tools.split(',') as AgentTool[]) : []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="h-6 w-6 text-purple-500" />
          Agent Builder
        </h1>
        <p className="text-muted-foreground text-sm">
          Specify your agent in 3 steps and generate production-ready code.
        </p>
      </div>
      <AgentBuilder
        initialName={params.name ?? ''}
        initialDesc={params.desc ?? ''}
        initialTools={tools}
      />
    </div>
  )
}
