import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Agent, AgentTemplate } from '@/lib/types'
import { GitBranch, Globe, Trash2 } from 'lucide-react'

interface AgentCardProps {
  item: Agent | AgentTemplate
  type: 'agent' | 'template'
  onDelete?: (id: string) => void
  onBuild?: (template: AgentTemplate) => void
}

export default function AgentCard({ item, type, onDelete, onBuild }: AgentCardProps) {
  const isAgent = type === 'agent'
  const agent = item as Agent
  const template = item as AgentTemplate

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    deployed: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700',
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{isAgent ? agent.spec.name : template.name}</CardTitle>
          {isAgent && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[agent.status]}`}>
              {agent.status}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isAgent ? agent.spec.description : template.description}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-3">
          {(isAgent ? agent.spec.tools : template.tools).map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
          ))}
        </div>
        {!isAgent && (
          <p className="text-xs text-muted-foreground mb-3">{template.useCase}</p>
        )}
        <div className="flex items-center gap-2">
          {isAgent && agent.githubUrl && (
            <a href={agent.githubUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <GitBranch className="h-3 w-3" /> GitHub
              </Button>
            </a>
          )}
          {isAgent && agent.vercelUrl && (
            <a href={agent.vercelUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Globe className="h-3 w-3" /> Live
              </Button>
            </a>
          )}
          {!isAgent && onBuild && (
            <Button size="sm" className="h-7 text-xs" onClick={() => onBuild(template)}>
              Use Template
            </Button>
          )}
          {isAgent && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-red-500 hover:text-red-700 ml-auto"
              onClick={() => onDelete(agent.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        {isAgent && (
          <p className="text-xs text-muted-foreground mt-2">
            Created {new Date(agent.createdAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
