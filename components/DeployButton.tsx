'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GitBranch, Globe, Loader2, Rocket } from 'lucide-react'
import type { DeployResult } from '@/lib/types'
import { toast } from 'sonner'

interface DeployButtonProps {
  agentId: string
  agentName: string
  agentCode?: string
  agentDescription?: string
  size?: 'default' | 'sm'
  onSuccess?: (githubUrl: string, vercelUrl?: string) => void
}

export default function DeployButton({
  agentId,
  agentName,
  agentCode,
  agentDescription,
  size = 'default',
  onSuccess,
}: DeployButtonProps) {
  const [open, setOpen] = useState(false)
  const [repoName, setRepoName] = useState(
    agentName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40)
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DeployResult | null>(null)

  async function deploy() {
    setLoading(true)
    const toastId = toast.loading('Deploying to GitHub & Vercel…')
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, repoName, agentCode, agentDescription }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, ...data })
        toast.success('Deployed!', { id: toastId, description: data.githubUrl })
        onSuccess?.(data.githubUrl, data.vercelUrl)
      } else {
        setResult({ success: false, error: data.error })
        toast.error('Deploy failed', { id: toastId, description: data.error })
      }
    } catch {
      toast.error('Network error', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)} className="gap-2" variant={size === 'sm' ? 'outline' : 'default'}>
        <Rocket className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
        {size === 'sm' ? '' : 'Deploy'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy — {agentName}</DialogTitle>
          </DialogHeader>
          {!result ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="repo">GitHub Repository Name</Label>
                  <Input
                    id="repo"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="my-agent"
                    className="mt-1 font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    github.com/{'{your-username}'}/{repoName}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p>✓ Creates a public GitHub repository with the agent code</p>
                  <p>✓ Links and deploys to your Vercel account</p>
                  <p>✓ Requires GITHUB_TOKEN and VERCEL_TOKEN env vars</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={deploy} disabled={loading || !repoName.trim()} className="gap-2">
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Deploying…</>
                    : <><Rocket className="h-4 w-4" />Deploy Now</>}
                </Button>
              </DialogFooter>
            </>
          ) : result.success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <span>✅</span> Deployed successfully!
              </div>
              <div className="space-y-2">
                {result.githubUrl && (
                  <a href={result.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all">
                    <GitBranch className="h-4 w-4 shrink-0" />
                    {result.githubUrl}
                  </a>
                )}
                {result.vercelUrl && (
                  <a href={result.vercelUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all">
                    <Globe className="h-4 w-4 shrink-0" />
                    {result.vercelUrl}
                  </a>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => { setOpen(false); setResult(null) }}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-600">❌ {result.error}</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); setResult(null) }}>Close</Button>
                <Button onClick={() => setResult(null)}>Retry</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
