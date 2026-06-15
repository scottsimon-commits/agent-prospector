import { AlertTriangle, ExternalLink, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SetupBannerProps {
  missing: ('ANTHROPIC_API_KEY' | 'GITHUB_TOKEN' | 'VERCEL_TOKEN')[]
}

const LINKS: Record<string, string> = {
  ANTHROPIC_API_KEY: 'https://console.anthropic.com/keys',
  GITHUB_TOKEN: 'https://github.com/settings/tokens',
  VERCEL_TOKEN: 'https://vercel.com/account/tokens',
}

const LABELS: Record<string, string> = {
  ANTHROPIC_API_KEY: 'Anthropic API Key (required for AI features)',
  GITHUB_TOKEN: 'GitHub Token (required for repo creation)',
  VERCEL_TOKEN: 'Vercel Token (required for deployment)',
}

export default function SetupBanner({ missing }: SetupBannerProps) {
  if (!missing.length) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">Setup required — some features are disabled</p>
      </div>
      <div className="space-y-1.5">
        {missing.map((key) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <KeyRound className="h-3 w-3 shrink-0" />
              <span>{LABELS[key]}</span>
            </div>
            <a href={LINKS[key]} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-6 text-xs gap-1 border-amber-200 hover:bg-amber-100 text-amber-800">
                Get key <ExternalLink className="h-2.5 w-2.5" />
              </Button>
            </a>
          </div>
        ))}
      </div>
      <p className="text-xs text-amber-600">
        Add these to{' '}
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          Vercel → Settings → Environment Variables
        </a>{' '}
        and redeploy.
      </p>
    </div>
  )
}
