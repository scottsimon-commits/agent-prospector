'use client'

import { Bot, Rocket, Database, GitBranch } from 'lucide-react'
import { useAgentStore } from './AgentStoreProvider'
import Link from 'next/link'

export default function DashboardStats() {
  const { agents } = useAgentStore()
  const deployed = agents.filter((a) => a.status !== 'draft').length
  const drafts = agents.filter((a) => a.status === 'draft').length

  const stats = [
    { label: 'Agents built', value: agents.length, icon: Bot, href: '/registry', color: 'text-primary' },
    { label: 'Deployed', value: deployed, icon: Rocket, href: '/registry', color: 'text-green-500' },
    { label: 'Drafts', value: drafts, icon: Database, href: '/registry', color: 'text-amber-500' },
    { label: 'Templates', value: 6, icon: GitBranch, href: '/gallery', color: 'text-orange-500' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, href, color }) => (
        <Link
          key={label}
          href={href}
          className="rounded-xl border bg-card p-4 hover:shadow-sm hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <p className="text-2xl font-bold">{value}</p>
        </Link>
      ))}
    </div>
  )
}
