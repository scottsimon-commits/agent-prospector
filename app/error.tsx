'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="rounded-full bg-red-100 p-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-1">Something went wrong</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {error.message || 'An unexpected error occurred.'}
        </p>
      </div>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  )
}
