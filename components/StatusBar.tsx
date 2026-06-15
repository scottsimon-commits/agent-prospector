'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Status {
  ai: boolean
  openrouter: boolean
  anthropic: boolean
  github: boolean
  vercel: boolean
  provider: 'openrouter' | 'anthropic' | null
}

export default function StatusBar() {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    fetch('/api/status').then((r) => r.json()).then(setStatus).catch(() => {})
  }, [])

  if (!status) return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 border bg-muted/30 border-muted animate-pulse h-9" />
  )

  const items = [
    {
      key: 'ai',
      label: status.provider === 'openrouter' ? 'AI (OpenRouter)' : status.provider === 'anthropic' ? 'AI (Claude)' : 'AI',
      ok: status.ai,
    },
    { key: 'github', label: 'GitHub', ok: status.github },
    { key: 'vercel', label: 'Vercel', ok: status.vercel },
  ]

  const allGood = items.every((i) => i.ok)

  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs rounded-lg px-3 py-2 border ${
      allGood ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
    }`}>
      {items.map(({ key, label, ok }) => (
        <div key={key} className="flex items-center gap-1">
          {ok
            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            : <XCircle className="h-3.5 w-3.5 text-amber-500" />}
          <span>{label}</span>
        </div>
      ))}
      {!allGood && (
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto underline font-medium shrink-0"
        >
          Configure env vars →
        </a>
      )}
    </div>
  )
}
