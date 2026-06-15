'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AgentTemplate } from '@/lib/types'
import { useRouter } from 'next/navigation'
import CodePreview from '@/components/CodePreview'
import { ExternalLink, Wrench } from 'lucide-react'

const TAG_COLORS: Record<string, string> = {
  research: 'bg-blue-100 text-blue-700',
  data: 'bg-teal-100 text-teal-700',
  automation: 'bg-purple-100 text-purple-700',
  github: 'bg-gray-100 text-gray-700',
  devtools: 'bg-zinc-100 text-zinc-700',
  'code-quality': 'bg-indigo-100 text-indigo-700',
  productivity: 'bg-green-100 text-green-700',
  analysis: 'bg-cyan-100 text-cyan-700',
  email: 'bg-yellow-100 text-yellow-700',
  analytics: 'bg-orange-100 text-orange-700',
  reporting: 'bg-amber-100 text-amber-700',
  support: 'bg-rose-100 text-rose-700',
  'customer-service': 'bg-pink-100 text-pink-700',
}

interface GalleryClientProps {
  templates: AgentTemplate[]
}

export default function GalleryClient({ templates }: GalleryClientProps) {
  const [selected, setSelected] = useState<AgentTemplate | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const router = useRouter()

  const allTags = Array.from(new Set(templates.flatMap((t) => t.tags)))
  const filtered = filter === 'all' ? templates : templates.filter((t) => t.tags.includes(filter))

  function buildUrl(t: AgentTemplate) {
    return `/build?name=${encodeURIComponent(t.name)}&desc=${encodeURIComponent(t.description)}&tools=${encodeURIComponent(t.tools.join(','))}`
  }

  return (
    <>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter(tag)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === tag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className="text-left rounded-xl border bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{t.description}</p>
            <p className="text-xs text-muted-foreground/70 mb-3 italic">{t.useCase}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {t.tools.map((tool) => (
                <Badge key={tool} variant="secondary" className="text-xs">{tool}</Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {t.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-xs text-primary mt-3 font-medium">Click to preview code →</p>
          </button>
        ))}
      </div>

      {/* Code preview dialog */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selected.name}
                <Badge variant="outline" className="text-xs font-normal">{selected.trigger}</Badge>
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-2">{selected.description}</p>
            <p className="text-xs text-muted-foreground/70 italic">{selected.useCase}</p>

            <div className="flex flex-wrap gap-1 mt-1">
              {selected.tools.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
            </div>

            <CodePreview code={selected.code} filename={`${selected.id}.ts`} />

            <div className="flex gap-2 mt-2">
              <Button className="flex-1 gap-2" onClick={() => { router.push(buildUrl(selected)); setSelected(null) }}>
                <Wrench className="h-4 w-4" />
                Open in Builder
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setSelected(null)}>
                <ExternalLink className="h-4 w-4" />
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
