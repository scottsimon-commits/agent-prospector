'use client'

import { useEffect, useState } from 'react'
import { Database, RefreshCw, Code2, Trash2, Globe, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Agent } from '@/lib/types'
import Link from 'next/link'
import { toast } from 'sonner'
import CodePreview from '@/components/CodePreview'

export default function RegistryPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<Agent | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/agents')
      setAgents(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function del(id: string, name: string) {
    await fetch('/api/agents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setAgents((prev) => prev.filter((a) => a.id !== id))
    toast.success(`Deleted "${name}"`)
  }

  useEffect(() => { load() }, [])

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    deployed: 'bg-blue-100 text-blue-700 border-blue-200',
    live: 'bg-green-100 text-green-700 border-green-200',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-green-500" />
            Agent Registry
          </h1>
          <p className="text-muted-foreground text-sm">
            {agents.length > 0
              ? `${agents.length} agent${agents.length === 1 ? '' : 's'} · Build more in the `
              : 'No agents yet · Build one in the '}
            <Link href="/build" className="underline text-foreground">Builder</Link>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-4/5" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 bg-muted rounded w-16" />
                <div className="h-5 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl border bg-muted/20 p-12 text-center space-y-4">
          <div className="inline-flex rounded-full bg-muted p-4">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No agents yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use the Builder to generate agent code, or grab a template from the Gallery.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Link href="/build"><Button>Build an agent</Button></Link>
            <Link href="/gallery"><Button variant="outline">Browse gallery</Button></Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Agent</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Tools</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{agent.spec.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{agent.spec.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {agent.spec.tools.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                      {agent.spec.tools.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{agent.spec.tools.length - 3}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[agent.status]}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="sm" variant="ghost" className="h-7 text-xs gap-1"
                        onClick={() => setPreview(agent)}
                      >
                        <Code2 className="h-3 w-3" /> Code
                      </Button>
                      {agent.githubUrl && (
                        <a href={agent.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                            <GitBranch className="h-3 w-3" />
                          </Button>
                        </a>
                      )}
                      {agent.vercelUrl && (
                        <a href={agent.vercelUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                            <Globe className="h-3 w-3" />
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => del(agent.id, agent.spec.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Code preview dialog */}
      {preview && (
        <Dialog open onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{preview.spec.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap gap-1 -mt-2">
              {preview.spec.tools.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
            </div>
            <CodePreview
              code={preview.code}
              filename={`${preview.spec.name.toLowerCase().replace(/\s+/g, '-')}.ts`}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
