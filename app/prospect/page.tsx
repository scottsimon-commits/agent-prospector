import type { Metadata } from 'next'
import ProspectorChat from '@/components/ProspectorChat'
import { Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Prospect',
  description: 'Discover where AI agents can save you the most time',
}

export default function ProspectPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6 text-blue-500" />
          Agent Prospector
        </h1>
        <p className="text-muted-foreground text-sm">
          Describe your role and workflow — I&apos;ll identify where AI agents can save you the most time.
        </p>
      </div>
      <ProspectorChat />
    </div>
  )
}
