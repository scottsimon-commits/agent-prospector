'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, ChevronRight, ChevronLeft, Wand2, Sparkles } from 'lucide-react'
import CodePreview from './CodePreview'
import DeployButton from './DeployButton'
import type { AgentSpec, AgentTool, AgentTrigger, AgentFormat, Agent } from '@/lib/types'
import { toast } from 'sonner'
import { useAgentStore } from './AgentStoreProvider'

const TOOLS: { id: AgentTool; label: string }[] = [
  { id: 'web-search', label: 'Web Search' },
  { id: 'file-io', label: 'File I/O' },
  { id: 'code-exec', label: 'Code Execution' },
  { id: 'api-calls', label: 'API Calls' },
  { id: 'email', label: 'Email' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'database', label: 'Database' },
  { id: 'github', label: 'GitHub' },
]

interface AgentBuilderProps {
  initialName?: string
  initialDesc?: string
  initialTools?: AgentTool[]
}

export default function AgentBuilder({ initialName = '', initialDesc = '', initialTools = [] }: AgentBuilderProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [suggestingPrompt, setSuggestingPrompt] = useState(false)
  const [agent, setAgent] = useState<Agent | null>(null)
  const { saveAgent: persistAgent } = useAgentStore()

  const [spec, setSpec] = useState<AgentSpec>({
    name: initialName,
    description: initialDesc,
    tools: initialTools,
    trigger: 'chat',
    systemPrompt: '',
    format: 'nextjs-api-route',
  })

  function toggleTool(tool: AgentTool) {
    setSpec((s) => ({
      ...s,
      tools: s.tools.includes(tool) ? s.tools.filter((t) => t !== tool) : [...s.tools, tool],
    }))
  }

  async function suggestPrompt() {
    setSuggestingPrompt(true)
    try {
      const res = await fetch('/api/suggest-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: spec.name, description: spec.description, tools: spec.tools }),
      })
      const data = await res.json()
      if (res.ok && data.prompt) {
        setSpec((s) => ({ ...s, systemPrompt: data.prompt }))
        toast.success('Prompt suggested!')
      } else {
        toast.error('Could not generate suggestion')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSuggestingPrompt(false)
    }
  }

  async function generate() {
    setLoading(true)
    const toastId = toast.loading('Generating agent code…')
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec }),
      })
      const data = await res.json()
      if (res.ok) {
        setAgent(data)
        persistAgent(data)
        setStep(3)
        toast.success('Agent code generated!', { id: toastId })
      } else if (res.status === 503) {
        toast.error('AI provider not configured', { id: toastId, description: 'Add OPENROUTER_API_KEY or ANTHROPIC_API_KEY in Vercel environment variables.' })
      } else {
        toast.error(data.error ?? 'Generation failed', { id: toastId })
      }
    } catch {
      toast.error('Network error — please try again', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>{s}</div>
            {s < 3 && <div className={`h-px w-8 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {step === 1 ? 'Spec' : step === 2 ? 'System Prompt' : 'Generated Code'}
        </span>
      </div>

      {/* Step 1 — Spec */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Agent Name</Label>
            <Input id="name" value={spec.name} onChange={(e) => setSpec((s) => ({ ...s, name: e.target.value }))}
              placeholder="e.g. Email Triage Assistant" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={spec.description}
              onChange={(e) => setSpec((s) => ({ ...s, description: e.target.value }))}
              placeholder="What does this agent do?" className="mt-1" rows={2} />
          </div>
          <div>
            <Label>Tools</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {TOOLS.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={spec.tools.includes(t.id)} onCheckedChange={() => toggleTool(t.id)} />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Trigger</Label>
              <Select value={spec.trigger} onValueChange={(v) => setSpec((s) => ({ ...s, trigger: v as AgentTrigger }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat / On-demand</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="schedule">Scheduled</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Output Format</Label>
              <Select value={spec.format} onValueChange={(v) => setSpec((s) => ({ ...s, format: v as AgentFormat }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nextjs-api-route">Next.js API Route</SelectItem>
                  <SelectItem value="standalone-node">Standalone Node.js</SelectItem>
                  <SelectItem value="claude-agent-sdk">Claude Agent SDK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => setStep(2)} disabled={!spec.name || !spec.description} className="w-full gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2 — System Prompt */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="prompt">System Prompt</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={suggestPrompt}
                disabled={suggestingPrompt}
              >
                {suggestingPrompt
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Sparkles className="h-3 w-3 text-yellow-500" />}
                {suggestingPrompt ? 'Suggesting…' : 'Suggest with AI'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Define the agent&apos;s personality, capabilities, and constraints.
            </p>
            <Textarea
              id="prompt"
              value={spec.systemPrompt}
              onChange={(e) => setSpec((s) => ({ ...s, systemPrompt: e.target.value }))}
              placeholder={`You are a ${spec.name || 'helpful agent'}. Your job is to...`}
              rows={8}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={generate} disabled={loading || !spec.systemPrompt} className="flex-1 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading ? 'Generating...' : 'Generate Agent Code'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Generated Code */}
      {step === 3 && agent && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <span className="text-green-500">✓</span> Agent Generated
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saved to registry · Copy, download, or deploy below
              </p>
            </div>
            <DeployButton
            agentId={agent.id}
            agentName={agent.spec.name}
            agentCode={agent.code}
            agentDescription={agent.spec.description}
          />
          </div>
          <CodePreview code={agent.code} filename={`${agent.spec.name.toLowerCase().replace(/\s+/g, '-')}.ts`} />
          <Button variant="outline" onClick={() => { setStep(1); setAgent(null) }} className="w-full">
            Build Another Agent
          </Button>
        </div>
      )}
    </div>
  )
}
