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

interface DeployButtonProps {
  agentId: string
  agentName: string
}

export default function DeployButton({ agentId, agentName }: DeployButtonProps) {
  const [open, setOpen] = useState(false)
  const [repoName, setRepoName] = useState(
    agentName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DeployResult | null>(null)

  async function deploy() {
    setLoading(true)
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, repoName }),
      })
      const data = await res.json()
      setResult(res.ok ? { success: true, ...data } : { success: false, error: data.error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Rocket className="h-4 w-4" />
        Deploy
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Agent</DialogTitle>
          </DialogHeader>
          {!result ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="repo">GitHub Repository Name</Label>
                  <Input
                    id="repo"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="my-agent"
                    className="mt-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This will create a public GitHub repo and deploy to Vercel automatically.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={deploy} disabled={loading || !repoName.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                  {loading ? 'Deploying...' : 'Deploy Now'}
                </Button>
              </DialogFooter>
            </>
          ) : result.success ? (
            <div className="space-y-4">
              <p className="text-sm text-green-600 font-medium">✅ Deployed successfully!</p>
              <div className="space-y-2">
                {result.githubUrl && (
                  <a href={result.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <GitBranch className="h-4 w-4" />
                    {result.githubUrl}
                  </a>
                )}
                {result.vercelUrl && (
                  <a href={result.vercelUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Globe className="h-4 w-4" />
                    {result.vercelUrl}
                  </a>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-600">❌ {result.error}</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                <Button onClick={() => setResult(null)}>Retry</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
