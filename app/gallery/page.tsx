import { ALL_TEMPLATES } from '@/lib/templates'
import { Bot } from 'lucide-react'
import AgentCard from '@/components/AgentCard'
import Link from 'next/link'

export default function GalleryPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-orange-500" />
          Template Gallery
        </h1>
        <p className="text-muted-foreground text-sm">
          6 production-ready agent templates. Click &ldquo;Use Template&rdquo; to open in the builder.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_TEMPLATES.map((template) => (
          <Link
            key={template.id}
            href={`/build?name=${encodeURIComponent(template.name)}&desc=${encodeURIComponent(template.description)}&tools=${encodeURIComponent(template.tools.join(','))}`}
          >
            <AgentCard item={template} type="template" />
          </Link>
        ))}
      </div>
    </div>
  )
}
