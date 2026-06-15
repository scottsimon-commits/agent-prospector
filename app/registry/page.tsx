'use client'

import { useEffect, useState } from 'react'
import { Database, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AgentCard from '@/components/AgentCard'
import type { Agent } from '@/lib/types'
import Link from 'next/link'

export default function RegistryPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/agents')
      const data = await res.json()
      setAgents(data)
    } finally {
      setLoading(false)
    }
  }

  async function del(id: string) {
    await fetch('/api/agents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setAgents((prev) => prev.filter((a) => a.id !== id))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-green-500" />
            Agent Registry
          </h1>
          <p className="text-muted-foreground text-sm">
            All agents created in this session. Build more in the{' '}
            <Link href="/build" className="underline">Builder</Link>.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Loading...
        </div>
      ) : agents.length === 0 ? (
        <div className="border rounded-xl p-10 text-center space-y-3">
          <Database className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm">No agents yet.</p>
          <Link href="/build">
            <Button size="sm">Build your first agent</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} item={agent} type="agent" onDelete={del} />
          ))}
        </div>
      )}
    </div>
  )
}
