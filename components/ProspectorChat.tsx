'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, Zap } from 'lucide-react'
import type { ChatMessage, OpportunityCard } from '@/lib/types'
import { useRouter } from 'next/navigation'

function parseOpportunities(text: string): OpportunityCard[] {
  const matches = text.match(/<opportunity>([\s\S]*?)<\/opportunity>/g) ?? []
  return matches.flatMap((m) => {
    try {
      const json = m.replace(/<\/?opportunity>/g, '').trim()
      return [JSON.parse(json) as OpportunityCard]
    } catch {
      return []
    }
  })
}

export default function ProspectorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [opportunities, setOpportunities] = useState<OpportunityCard[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
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

    try {
      const res = await fetch('/api/prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) {
        const err = await res.text()
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err}` }])
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const delta = parsed?.delta?.text ?? ''
            assistantText += delta
            setMessages((prev) => [
              ...prev.slice(0, -1),
              { role: 'assistant', content: assistantText },
            ])
          } catch {}
        }
      }

      const found = parseOpportunities(assistantText)
      if (found.length) setOpportunities((prev) => [...prev, ...found])
    } finally {
      setLoading(false)
    }
  }

  const complexityColor: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Chat */}
      <div className="flex flex-col gap-3 min-h-[300px] max-h-[500px] overflow-y-auto border rounded-xl p-4 bg-muted/30">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-sm text-center mt-8">
            Tell me about your role and daily workflow — I&apos;ll find where agents can help.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border shadow-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-background border shadow-sm rounded-xl px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Describe your role, tools you use, and repetitive tasks..."
          className="resize-none"
          rows={2}
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="h-auto">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Opportunity Cards */}
      {opportunities.length > 0 && (
        <div className="mt-2">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Agent Opportunities Found
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {opportunities.map((opp, i) => (
              <div key={i} className="border rounded-xl p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm">{opp.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${complexityColor[opp.complexity]}`}>
                    {opp.complexity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{opp.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {opp.tools.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-600 font-medium">💡 {opp.estimatedValue}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => router.push(`/build?name=${encodeURIComponent(opp.name)}&desc=${encodeURIComponent(opp.description)}&tools=${encodeURIComponent(opp.tools.join(','))}`)}
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
