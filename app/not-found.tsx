import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="rounded-full bg-muted p-4">
        <Bot className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-1">404</h2>
        <p className="text-muted-foreground text-sm">This page doesn&apos;t exist.</p>
      </div>
      <Link href="/">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  )
}
