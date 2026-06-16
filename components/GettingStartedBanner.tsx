'use client'

import { useState, useEffect } from 'react'
import { useAgentStore } from './AgentStoreProvider'
import { X, ArrowRight, Search, Wrench, Rocket } from 'lucide-react'
import Link from 'next/link'

const DISMISSED_KEY = 'ap_getting_started_dismissed'

export default function GettingStartedBanner() {
  const { agents } = useAgentStore()
  const [dismissed, setDismissed] = useState(true) // start hidden, set after mount

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true')
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  // Hide once the user has built something or dismissed
  if (dismissed || agents.length > 0) return null

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 relative">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        title="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Getting started</p>

      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        {[
          { icon: Search, step: '1', label: 'Prospect', desc: 'Tell the AI your role. It finds automation opportunities for you.', href: '/prospect', cta: 'Start a conversation' },
          { icon: Wrench, step: '2', label: 'Build', desc: 'Pick an opportunity and generate production TypeScript code in 3 steps.', href: '/build', cta: 'Open the builder' },
          { icon: Rocket, step: '3', label: 'Deploy', desc: 'One click pushes your agent to GitHub and deploys it on Vercel.', href: '/build', cta: 'After building' },
        ].map(({ icon: Icon, step, label, desc, href, cta }) => (
          <div key={step} className="flex gap-3">
            <div className="shrink-0 h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
              {step}
            </div>
            <div>
              <p className="font-medium text-sm flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" /> {label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              <Link href={href} className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1.5 hover:underline">
                {cta} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        New to this? Click the <strong>?</strong> button in the bottom-left corner anytime to open the full tutorial.
      </p>
    </div>
  )
}
