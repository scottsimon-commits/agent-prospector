import type { Metadata } from 'next'
import { ALL_TEMPLATES } from '@/lib/templates'
import { Bot } from 'lucide-react'
import GalleryClient from './GalleryClient'

export const metadata: Metadata = {
  title: 'Template Gallery',
  description: '6 production-ready AI agent templates ready to deploy',
}

export default function GalleryPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-orange-500" />
          Template Gallery
        </h1>
        <p className="text-muted-foreground text-sm">
          {ALL_TEMPLATES.length} production-ready agent templates. Click any to preview code and open in the builder.
        </p>
      </div>
      <GalleryClient templates={ALL_TEMPLATES} />
    </div>
  )
}
