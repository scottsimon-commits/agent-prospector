'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Copy, Download } from 'lucide-react'
import { toast } from 'sonner'

interface CodePreviewProps {
  code: string
  filename?: string
}

export default function CodePreview({ code, filename = 'agent.ts' }: CodePreviewProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filename}`)
  }

  // Simple keyword-based syntax coloring without a heavy parser
  function highlight(src: string): React.ReactNode[] {
    const lines = src.split('\n')
    return lines.map((line, i) => (
      <span key={i} className="block">
        {tokenize(line)}
        {'\n'}
      </span>
    ))
  }

  function tokenize(line: string): React.ReactNode {
    // Match in priority order
    const patterns: [RegExp, string][] = [
      [/^(\s*\/\/.*)/g, 'text-zinc-500'],                          // single-line comment
      [/(`[^`]*`)/g, 'text-amber-300'],                            // template literal
      [/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, 'text-amber-300'], // strings
      [/\b(import|export|from|const|let|var|function|async|await|return|if|else|for|while|try|catch|throw|new|typeof|interface|type|extends|implements|class|default)\b/g, 'text-purple-400'], // keywords
      [/\b(string|number|boolean|void|null|undefined|Promise|Array|Record|true|false)\b/g, 'text-blue-400'], // types/builtins
      [/\b([A-Z][a-zA-Z0-9]*)\b/g, 'text-teal-300'],              // class names
    ]

    let parts: Array<{ text: string; cls: string | null }> = [{ text: line, cls: null }]

    for (const [regex, cls] of patterns) {
      const next: typeof parts = []
      for (const part of parts) {
        if (part.cls !== null) { next.push(part); continue }
        const segments = part.text.split(regex)
        let isMatch = false
        for (const seg of segments) {
          next.push({ text: seg, cls: isMatch ? cls : null })
          isMatch = !isMatch
        }
      }
      parts = next
    }

    return parts.map((p, i) =>
      p.cls
        ? <span key={i} className={p.cls}>{p.text}</span>
        : <span key={i}>{p.text}</span>
    )
  }

  return (
    <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs text-zinc-400 font-mono ml-2">{filename}</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-xs text-zinc-400 hover:text-zinc-100 gap-1 px-2" onClick={download}>
            <Download className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-xs text-zinc-400 hover:text-zinc-100 gap-1 px-2" onClick={copy}>
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
      {/* Code */}
      <div className="overflow-auto max-h-[520px]">
        <table className="w-full border-collapse text-xs font-mono leading-relaxed">
          <tbody>
            {code.split('\n').map((line, i) => (
              <tr key={i} className="hover:bg-zinc-900/50">
                <td className="select-none text-right text-zinc-600 pr-4 pl-4 w-12 border-r border-zinc-800/50 py-0">
                  {i + 1}
                </td>
                <td className="pl-4 pr-4 py-0 whitespace-pre">
                  {tokenize(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
