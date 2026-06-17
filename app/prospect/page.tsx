import type { Metadata } from 'next'
import ProspectorChat from '@/components/ProspectorChat'
import { User } from 'lucide-react'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Individual Prospect',
  description: 'Discover where AI agents can save you the most time in your own workflow',
}

export default function ProspectPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-blue-500" />
          Individual Prospecting
        </h1>
        <p className="text-muted-foreground text-sm">
          Describe your role and workflow — I&apos;ll identify where AI agents can save you the most time.
        </p>
        <p className="text-xs text-muted-foreground pt-1">
          Looking to research a specific company?{' '}
          <Link href="/business" className="text-primary hover:underline inline-flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            Business Prospector
          </Link>
        </p>
      </div>
      <ProspectorChat />
    </div>
  )
}
