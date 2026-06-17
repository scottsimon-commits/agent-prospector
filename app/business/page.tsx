import type { Metadata } from 'next'
import BusinessProspector from '@/components/BusinessProspector'
import { Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Business Prospector',
  description: 'Research any company and discover their highest-impact AI agent opportunities',
}

export default function BusinessPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-emerald-500" />
          Business Prospector
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter any company name and location — I&apos;ll research the business and identify the most impactful AI agents for their specific operations.
        </p>
      </div>
      <BusinessProspector />
    </div>
  )
}
