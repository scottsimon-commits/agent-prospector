'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Status {
  anthropic: boolean
  github: boolean
  vercel: boolean
}

export default function StatusBar() {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    fetch('/api/status').then((r) => r.json()).then(setStatus).catch(() => {})
  }, [])

  if (!status) return null

  const items = [
    { key: 'anthropic', label: 'Claude AI', ok: status.anthropic },
    { key: 'github', label: 'GitHub', ok: status.github },
    { key: 'vercel', label: 'Vercel', ok: status.vercel },
  ]

  const allGood = items.every((i) => i.ok)

  return (
    <div className={`flex items-center gap-4 text-xs rounded-lg px-3 py-2 border ${
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
          className="ml-auto underline font-medium"
        >
          Add env vars →
        </a>
      )}
    </div>
  )
}
