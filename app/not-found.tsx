import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bot, Home } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '404 — Page Not Found' }

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 text-center px-4">
      <div className="rounded-full bg-muted p-5">
        <Bot className="h-10 w-10 text-muted-foreground" />
      </div>
      <div>
        <p className="text-5xl font-bold text-muted-foreground/20 mb-2">404</p>
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          This agent wandered off. Let&apos;s get you back on track.
        </p>
      </div>
      <Link href="/">
        <Button className="gap-2">
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  )
}
