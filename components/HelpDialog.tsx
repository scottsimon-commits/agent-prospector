'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HelpCircle, Search, Wrench, Bot, Database, Rocket, Zap, ChevronRight } from 'lucide-react'

const steps = [
  {
    icon: Search,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    title: '1 · Prospect — Find opportunities',
    href: '/prospect',
    content: [
      'Go to the Prospect page in the left sidebar.',
      'Click one of the 4 role buttons (e.g. "I\'m a marketer…") to pre-fill the chat, or type your own description of your job and daily tasks.',
      'The AI will ask you 1–2 focused questions to understand your workflow.',
      'After a few exchanges it will surface 2–4 Agent Opportunity cards — each one is a specific task that an AI agent could automate for you.',
      'Click "Build this →" on any card to move straight into the Builder with the details pre-filled.',
    ],
  },
  {
    icon: Wrench,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    title: '2 · Build — Generate agent code',
    href: '/build',
    content: [
      'Step 1 — Spec: Give your agent a name and description. Check the tools it needs (Web Search, Email, GitHub, etc.). Choose when it triggers (Chat, Webhook, or Scheduled) and the output format.',
      'Step 2 — System Prompt: Write instructions that define the agent\'s personality and job. Click "Suggest with AI ✨" to have the AI draft a prompt for you based on your spec.',
      'Step 3 — Generate: Click "Generate Agent Code". The AI writes a complete, production-ready TypeScript file. You can copy or download it.',
      'The agent is automatically saved to your Registry.',
    ],
  },
  {
    icon: Bot,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    title: '3 · Gallery — Browse templates',
    href: '/gallery',
    content: [
      'Browse 6 ready-made agent templates: Web Scraper, Code Reviewer, Research Agent, Email Processor, Data Analyst, and Support Bot.',
      'Use the filter pills at the top to filter by category (research, automation, email, etc.).',
      'Click any card to preview the full generated TypeScript code.',
      'Click "Open in Builder" to customise the template before deploying.',
    ],
  },
  {
    icon: Rocket,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
    title: '4 · Deploy — Push to GitHub + Vercel',
    href: '/build',
    content: [
      'After generating code in the Builder, click the "Deploy" button.',
      'Type a repository name (auto-filled from the agent name).',
      'Click "Deploy Now" — the app will: create a public GitHub repo with the agent code, link it to your Vercel account, and trigger the first deployment.',
      'You\'ll get a live GitHub URL and a live Vercel URL for your running agent.',
      'You can also deploy from the Registry page for any draft agent.',
    ],
  },
  {
    icon: Database,
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    title: '5 · Registry — Manage your agents',
    href: '/registry',
    content: [
      'The Registry shows every agent you\'ve created in this browser, with their status (draft or deployed).',
      'Click "Code" to view the generated TypeScript source at any time.',
      'If an agent is deployed, icons link directly to its GitHub repo and live Vercel URL.',
      'Click the trash icon to delete an agent from your registry.',
      'Note: agents are saved in your browser (localStorage). Clearing browser data will remove them.',
    ],
  },
]

const tips = [
  { icon: Zap, text: 'The status bar at the top of the Dashboard shows whether AI, GitHub, and Vercel are all connected. All three should show a green checkmark.' },
  { icon: ChevronRight, text: 'If the AI seems slow or shows a connection error, wait 10 seconds and try again — free AI models are occasionally rate-limited upstream. The app retries automatically.' },
  { icon: ChevronRight, text: 'Dark mode toggle is the sun/moon icon at the bottom of the sidebar (or top-right on mobile).' },
  { icon: ChevronRight, text: 'Your agents are stored only in this browser. If you switch devices or clear browser storage, the Registry will be empty — but your deployed agents still live on GitHub and Vercel.' },
]

export default function HelpDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        title="Help & Tutorial"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              How to use Agent Prospector
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground -mt-1">
            Agent Prospector helps you discover where AI can save you time, then scaffolds and deploys the code automatically. Here&apos;s the full workflow:
          </p>

          <div className="space-y-4 mt-2">
            {steps.map(({ icon: Icon, color, bg, title, content }) => (
              <div key={title} className={`rounded-xl p-4 ${bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <h3 className="font-semibold text-sm">{title}</h3>
                </div>
                <ol className="space-y-1.5">
                  {content.map((line, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                      <span className="shrink-0 font-medium text-foreground/60">{i + 1}.</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded-xl border p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tips</p>
            {tips.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-2">
            <Button onClick={() => setOpen(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
