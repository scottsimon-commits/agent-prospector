export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
      <div className="h-4 w-72 rounded bg-muted animate-pulse" />
      <div className="h-[480px] rounded-xl border bg-muted/20 animate-pulse" />
      <div className="h-20 rounded-xl border bg-muted/20 animate-pulse" />
    </div>
  )
}
