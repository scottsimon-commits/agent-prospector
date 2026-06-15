import Link from 'next/link'
import { Bot, Search, Wrench, Database, ArrowRight, Zap, Code2, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    href: '/prospect',
    icon: Search,
    title: 'Prospect',
    description: 'Have a conversation with Claude to uncover your best AI agent opportunities.',
    cta: 'Start prospecting',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    href: '/build',
    icon: Wrench,
    title: 'Build',
    description: 'Generate production-ready agent code from a simple 3-step specification wizard.',
    cta: 'Build an agent',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    href: '/gallery',
    icon: Bot,
    title: 'Gallery',
    description: 'Browse 6 ready-made agent templates. Preview code, then open in the builder.',
    cta: 'Browse templates',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    href: '/registry',
    icon: Database,
    title: 'Registry',
    description: 'Track all your created agents, view their code, and manage deployments.',
    cta: 'View registry',
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
]

const steps = [
  { icon: Search, label: 'Prospect', desc: 'Discover agent opportunities through conversation' },
  { icon: Code2, label: 'Build', desc: 'Generate TypeScript code with one click' },
  { icon: Rocket, label: 'Deploy', desc: 'Push to GitHub & Vercel automatically' },
]

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Hero */}
      <div className="space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-yellow-500" />
          Powered by Claude · Deploys to Vercel
        </div>
        <h1 className="text-4xl font-bold tracking-tight leading-tight">
          Discover, build &amp; deploy<br />
          <span className="text-primary">AI agents</span> — instantly
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
          Agent Prospector helps you find where AI agents can save time, scaffolds their code with Claude, and deploys them to GitHub + Vercel in one click.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href="/prospect">
            <Button size="lg" className="gap-2">
              <Search className="h-4 w-4" />
              Start Prospecting
            </Button>
          </Link>
          <Link href="/gallery">
            <Button size="lg" variant="outline" className="gap-2">
              <Bot className="h-4 w-4" />
              Browse Templates
            </Button>
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border bg-muted/20 p-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">How it works</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} className="flex items-start gap-3">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {i + 1}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map(({ href, icon: Icon, title, description, cta, color, bg }) => (
          <Link key={href} href={href} className="group block rounded-2xl border bg-card p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <h2 className="font-semibold mb-1">{title}</h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              {cta}
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
