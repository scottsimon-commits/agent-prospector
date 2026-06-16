export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-muted/50 border-b px-4 py-3 flex gap-8">
          {['Agent', 'Tools', 'Status', 'Created', ''].map((h, i) => (
            <div key={i} className="h-3 w-16 rounded bg-muted animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b px-4 py-3 flex items-center gap-8">
            <div className="flex-1 space-y-1">
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
              <div className="h-3 w-56 rounded bg-muted animate-pulse" />
            </div>
            <div className="flex gap-1">
              <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
