export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
      <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
            {i < 3 && <div className="h-px w-8 bg-muted" />}
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-10 rounded-lg bg-muted animate-pulse" />
        <div className="h-20 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
