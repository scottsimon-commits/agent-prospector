'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Zap, Bot, User, AlertTriangle } from 'lucide-react'
import type { ChatMessage, OpportunityCard } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

function parseOpportunities(text: string): OpportunityCard[] {
  const matches = text.match(/<opportunity>([\s\S]*?)<\/opportunity>/g) ?? []
  return matches.flatMap((m) => {
    try {
      return [JSON.parse(m.replace(/<\/?opportunity>/g, '').trim()) as OpportunityCard]
    } catch {
      return []
    }
  })
}

// Robust SSE text extraction — handles multi-byte chunks and partial lines
function extractTextFromSSEChunk(chunk: string): string {
  let out = ''
  const lines = chunk.split('\n')
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue
    const payload = line.slice(6).trim()
    if (!payload || payload === '[DONE]') continue
    try {
      const evt = JSON.parse(payload)
      // Normalized format from our API route: { text: "..." }
      if (typeof evt.text === 'string') {
        out += evt.text
      }
      // Throw on server-reported errors
      if (evt.error) throw new Error(evt.error)
    } catch (e) {
      if (e instanceof Error && e.message !== 'Unexpected token') throw e
    }
  }
  return out
}

export default function ProspectorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [opportunities, setOpportunities] = useState<OpportunityCard[]>([])
  const [apiMissing, setApiMissing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setApiMissing(false)

    try {
      const res = await fetch('/api/prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (res.status === 503) {
        setApiMissing(true)
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      if (!res.ok) {
        toast.error('Failed to get a response. Please try again.')
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      let buffer = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Process complete lines only — avoids splitting mid-JSON
        const lastNewline = buffer.lastIndexOf('\n')
        if (lastNewline === -1) continue
        const toProcess = buffer.slice(0, lastNewline + 1)
        buffer = buffer.slice(lastNewline + 1)

        const delta = extractTextFromSSEChunk(toProcess)
        if (delta) {
          assistantText += delta
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: assistantText },
          ])
        }
      }

      // Process any remaining buffer
      const remaining = extractTextFromSSEChunk(buffer)
      if (remaining) {
        assistantText += remaining
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantText },
        ])
      }

      const found = parseOpportunities(assistantText)
      if (found.length) {
        setOpportunities((prev) => [...prev, ...found])
        toast.success(`${found.length} agent opportunit${found.length === 1 ? 'y' : 'ies'} found!`)
      }
    } catch (err) {
      toast.error('Connection error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  const complexityColor: Record<string, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div className="flex flex-col gap-5">
      {/* API key warning */}
      {apiMissing && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">AI provider not configured</p>
            <p className="text-yellow-700 mt-0.5">
              Add <code className="bg-yellow-100 px-1 rounded">OPENROUTER_API_KEY</code> or <code className="bg-yellow-100 px-1 rounded">ANTHROPIC_API_KEY</code> to{' '}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">
                Vercel environment variables
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* Chat window */}
      <div className="flex flex-col gap-4 min-h-[320px] max-h-[480px] overflow-y-auto rounded-xl border bg-background p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-6">
            <div className="rounded-full bg-primary/10 p-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Ready to prospect</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Describe your role and daily workflow — I&apos;ll identify your best AI agent opportunities.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {[
                "I'm a software engineer who reviews PRs and writes code daily",
                "I'm a marketer who tracks campaigns and creates weekly reports",
                "I'm a founder doing customer support and outreach",
                "I'm a data analyst cleaning spreadsheets and generating insights",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-xs border rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs ${
              m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border'
            }`}>
              {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-muted rounded-tl-sm'
            }`}>
              {m.content || <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}
          placeholder="Describe your role, tools, and repetitive tasks… (Enter to send)"
          className="resize-none min-h-[80px]"
          rows={3}
        />
        <Button
          onClick={send}
          disabled={loading || !input.trim()}
          size="icon"
          className="h-10 w-10 shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* Opportunity Cards */}
      {opportunities.length > 0 && (
        <div className="mt-2 space-y-3">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-500" />
            {opportunities.length} Agent {opportunities.length === 1 ? 'Opportunity' : 'Opportunities'} Found
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {opportunities.map((opp, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm leading-snug">{opp.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${complexityColor[opp.complexity ?? 'medium']}`}>
                    {opp.complexity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{opp.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(opp.tools ?? []).map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs px-2">{t}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-medium">💡 {opp.estimatedValue}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 gap-1"
                    onClick={() =>
                      router.push(
                        `/build?name=${encodeURIComponent(opp.name)}&desc=${encodeURIComponent(opp.description)}&tools=${encodeURIComponent((opp.tools ?? []).join(','))}`
                      )
                    }
                  >
                    Build this →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
