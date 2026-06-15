import Link from 'next/link'
import { Bot, Search, Wrench, Database, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    href: '/prospect',
    icon: Search,
    title: 'Prospect',
    description: 'Chat with AI to discover where agents can save you time.',
    cta: 'Start prospecting',
    color: 'text-blue-500',
  },
  {
    href: '/build',
    icon: Wrench,
    title: 'Build',
    description: 'Generate production-ready agent code from a simple spec.',
    cta: 'Build an agent',
    color: 'text-purple-500',
  },
  {
    href: '/gallery',
    icon: Bot,
    title: 'Gallery',
    description: 'Browse 6 ready-made agent templates and deploy in one click.',
    cta: 'Browse templates',
    color: 'text-orange-500',
  },
  {
    href: '/registry',
    icon: Database,
    title: 'Registry',
    description: 'Manage all your created and deployed agents in one place.',
    cta: 'View registry',
    color: 'text-green-500',
  },
]

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold tracking-tight">Agent Prospector</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-xl">
          Discover where AI agents can help, generate their code, and deploy them to GitHub + Vercel — all in one place.
        </p>
        <div className="flex gap-3 pt-1">
          <Link href="/prospect">
            <Button className="gap-2">
              <Search className="h-4 w-4" />
              Start Prospecting
            </Button>
          </Link>
          <Link href="/gallery">
            <Button variant="outline" className="gap-2">
              Browse Templates
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map(({ href, icon: Icon, title, description, cta, color }) => (
          <Card key={href} className="hover:shadow-md transition-shadow group">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className={`h-5 w-5 ${color}`} />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
              <Link href={href} className="flex items-center gap-1 text-sm font-medium hover:underline">
                {cta}
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="border rounded-xl p-5 bg-muted/20">
        <p className="text-sm text-muted-foreground">
          💡 <strong>How it works:</strong> Use <strong>Prospect</strong> to find agent opportunities through conversation →
          then <strong>Build</strong> to generate code → and <strong>Deploy</strong> to push to GitHub and Vercel automatically.
        </p>
      </div>
    </div>
  )
}
