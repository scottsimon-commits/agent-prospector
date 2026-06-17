'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  MapPin,
  Search,
  Loader2,
  CheckCircle2,
  Star,
  TrendingUp,
  Clock,
  Zap,
  ChevronRight,
  Copy,
  RotateCcw,
  AlertTriangle,
  Briefcase,
  Users,
  Cpu,
  Globe,
} from 'lucide-react'
import type { BusinessProspectResult, AgentRecommendation } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Phase = 'idle' | 'loading' | 'success' | 'error'

const LOADING_STEPS = [
  'Searching for company website…',
  'Reading website content…',
  'Analyzing business operations…',
  'Generating tailored recommendations…',
  'Ranking agents by impact…',
]

const complexityColor: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const categoryColor: Record<string, string> = {
  'Customer Service': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Sales: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Operations: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  Marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Finance: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  Scheduling: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'Field Service': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  HR: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  Inventory: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
}

function getCategoryColor(cat: string): string {
  return categoryColor[cat] ?? 'bg-muted text-muted-foreground'
}

function RecommendationCard({ rec, isPrimary }: { rec: AgentRecommendation; isPrimary: boolean }) {
  const router = useRouter()

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isPrimary
          ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
          : 'bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isPrimary && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
              <Star className="h-3 w-3" />
              Top Pick #{rec.rank}
            </span>
          )}
          {!isPrimary && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              #{rec.rank}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(rec.category)}`}>
            {rec.category}
          </span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${complexityColor[rec.complexity]}`}>
          {rec.complexity}
        </span>
      </div>

      <div>
        <h3 className="font-semibold text-sm leading-snug">{rec.name}</h3>
        <p className="text-xs text-muted-foreground italic mt-0.5">{rec.tagline}</p>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>

      <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
        <span className="font-medium text-foreground">Why this company: </span>
        <span className="text-muted-foreground">{rec.whyThisCompany}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {rec.tools.map((t) => (
          <Badge key={t} variant="secondary" className="text-xs px-2">
            {t}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Zap className="h-3 w-3" />
            {rec.impact}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {rec.implementationTime}
          </span>
        </div>
        <Button
          size="sm"
          variant={isPrimary ? 'default' : 'outline'}
          className="text-xs h-7 gap-1 shrink-0"
          onClick={() =>
            router.push(
              `/build?name=${encodeURIComponent(rec.name)}&desc=${encodeURIComponent(rec.description)}&tools=${encodeURIComponent(rec.tools.join(','))}`
            )
          }
        >
          Build this
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export default function BusinessProspector() {
  const [companyName, setCompanyName] = useState('')
  const [location, setLocation] = useState('')
  const [context, setContext] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<BusinessProspectResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const [apiMissing, setApiMissing] = useState(false)

  useEffect(() => {
    if (phase !== 'loading') return
    setLoadingStep(0)
    const interval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s))
    }, 3000)
    return () => clearInterval(interval)
  }, [phase])

  async function research() {
    if (!companyName.trim() || !location.trim() || phase === 'loading') return
    setPhase('loading')
    setResult(null)
    setErrorMsg('')
    setApiMissing(false)

    try {
      const res = await fetch('/api/business-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          location: location.trim(),
          context: context.trim() || undefined,
        }),
      })

      if (res.status === 503) {
        setApiMissing(true)
        setPhase('error')
        return
      }

      const data = await res.json()

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? 'Research failed. Please try again.')
        setPhase('error')
        return
      }

      setResult(data as BusinessProspectResult)
      setPhase('success')
      toast.success(`Research complete — ${data.recommendations?.length ?? 0} agent recommendations ready`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('429') || msg.includes('rate')) {
        toast.error('AI models are busy', {
          description: 'Both free models are rate-limited. Wait 10–30 seconds and try again.',
        })
      } else {
        toast.error('Connection error', { description: 'Could not reach the AI. Check your internet and try again.' })
      }
      setErrorMsg('Connection error. Please try again.')
      setPhase('error')
    }
  }

  function copyAIASummary() {
    if (!result) return
    const primary = result.recommendations.filter((r) => r.tier === 'primary')
    const expansion = result.recommendations.filter((r) => r.tier === 'expansion')

    const lines = [
      `COMPANY: ${result.company.name}`,
      `INDUSTRY: ${result.company.industry} (${result.company.businessType})`,
      `SIZE: ${result.company.estimatedSize}`,
      `TECH: ${result.company.technologyProfile}`,
      '',
      'KEY PAIN POINTS:',
      ...result.company.keyPainPoints.map((p) => `  • ${p}`),
      '',
      '--- TOP AGENT RECOMMENDATIONS (AIA Primary) ---',
      '',
      ...primary.flatMap((r) => [
        `#${r.rank} ${r.name}`,
        `Category: ${r.category} | Complexity: ${r.complexity} | Timeline: ${r.implementationTime}`,
        `${r.description}`,
        `Why: ${r.whyThisCompany}`,
        `Impact: ${r.impact}`,
        '',
      ]),
      '--- EXPANSION AGENTS ---',
      '',
      ...expansion.flatMap((r) => [
        `#${r.rank} ${r.name} (${r.category})`,
        `${r.tagline}`,
        `Impact: ${r.impact}`,
        '',
      ]),
    ]

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      toast.success('AIA summary copied to clipboard', {
        description: 'Paste directly into your AIA template.',
      })
    })
  }

  function reset() {
    setPhase('idle')
    setResult(null)
    setErrorMsg('')
    setCompanyName('')
    setLocation('')
    setContext('')
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="rounded-full bg-primary/10 p-5">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
        <div>
          <p className="font-semibold text-base">Researching {companyName}…</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Analyzing their industry, operations, and automation opportunities
          </p>
        </div>
        <div className="flex flex-col gap-2 text-left w-full max-w-xs">
          {LOADING_STEPS.map((step, i) => (
            <div key={step} className={`flex items-center gap-2 text-sm transition-opacity ${i <= loadingStep ? 'opacity-100' : 'opacity-30'}`}>
              {i < loadingStep ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : i === loadingStep ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />
              )}
              <span className={i <= loadingStep ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'success' && result) {
    const primary = result.recommendations.filter((r) => r.tier === 'primary')
    const expansion = result.recommendations.filter((r) => r.tier === 'expansion')

    return (
      <div className="space-y-8">
        {/* Company Profile */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <h2 className="font-bold text-lg leading-tight">{result.company.name}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{result.company.industry}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{result.company.businessType}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {result.company.estimatedSize}
              </Badge>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {result.websiteUrl && (
              <a
                href={result.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {new URL(result.websiteUrl).hostname.replace(/^www\./, '')}
              </a>
            )}
            {!result.websiteUrl && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60 italic">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                No website found — based on industry knowledge
              </span>
            )}
          </div>

          <div className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Cpu className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{result.company.technologyProfile}</span>
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Primary Operations</p>
              <ul className="space-y-1">
                {result.company.primaryOperations.map((op) => (
                  <li key={op} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                    {op}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Key Pain Points</p>
              <ul className="space-y-1">
                {result.company.keyPainPoints.map((pain) => (
                  <li key={pain} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500/70" />
                    {pain}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Primary Recommendations */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-amber-500" />
            <h2 className="font-bold text-base">Top Recommendations</h2>
            <Badge variant="secondary" className="text-xs">AIA Primary</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {primary.map((rec) => (
              <RecommendationCard key={rec.rank} rec={rec} isPrimary />
            ))}
          </div>
        </div>

        {/* Expansion Agents */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h2 className="font-bold text-base">Expansion Agents</h2>
            <Badge variant="secondary" className="text-xs">Growth Roadmap</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {expansion.map((rec) => (
              <RecommendationCard key={rec.rank} rec={rec} isPrimary={false} />
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
          <Button onClick={copyAIASummary} variant="default" className="gap-2">
            <Copy className="h-4 w-4" />
            Copy AIA Summary
          </Button>
          <Button onClick={reset} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Research Another Company
          </Button>
          <p className="text-xs text-muted-foreground ml-auto hidden sm:block">
            AIA Report generation coming soon
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* API missing warning */}
      {(phase === 'error' && apiMissing) && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">AI provider not configured</p>
            <p className="text-yellow-700 mt-0.5">
              Add <code className="bg-yellow-100 px-1 rounded">OPENROUTER_API_KEY</code> to{' '}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">
                Vercel environment variables
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* General error */}
      {(phase === 'error' && !apiMissing) && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Research failed</p>
            <p className="text-red-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Company Name
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Johnson's Plumbing, Lakeside Family Dental, Tri-State Logistics"
            onKeyDown={(e) => {
              if (e.key === 'Enter') research()
            }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Location
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Watertown, SD · Minneapolis, MN · Chicago, IL"
            onKeyDown={(e) => {
              if (e.key === 'Enter') research()
            }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Additional Context <span className="font-normal normal-case">(optional)</span>
          </label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Website URL, number of employees, key services, current software, specific challenges… The more detail, the sharper the recommendations."
            className="resize-none min-h-[80px] text-sm"
            rows={3}
          />
        </div>

        <Button
          onClick={research}
          disabled={!companyName.trim() || !location.trim()}
          className="w-full gap-2"
          size="lg"
        >
          <Search className="h-4 w-4" />
          Research This Company
        </Button>
      </div>

      {/* Example companies */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "Murphy's Auto Repair", loc: 'Sioux Falls, SD' },
            { name: 'Prairie View Dental', loc: 'Aberdeen, SD' },
            { name: 'Black Hills Roofing Co.', loc: 'Rapid City, SD' },
            { name: 'Main Street Realty', loc: 'Watertown, SD' },
          ].map(({ name, loc }) => (
            <button
              key={name}
              onClick={() => {
                setCompanyName(name)
                setLocation(loc)
              }}
              className="flex items-center gap-1.5 text-xs border rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Briefcase className="h-3 w-3" />
              {name} · {loc}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
