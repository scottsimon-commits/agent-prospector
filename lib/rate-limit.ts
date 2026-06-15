// Simple sliding-window rate limiter using an in-memory Map.
// On Vercel each serverless function instance has its own Map,
// so this only protects within a single invocation context.
// For multi-instance rate limiting, swap for Vercel KV / Upstash.

const windows = new Map<string, number[]>()

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now()
  const windowStart = now - windowMs
  const hits = (windows.get(key) ?? []).filter((t) => t > windowStart)
  hits.push(now)
  windows.set(key, hits)

  // Prevent unbounded memory growth
  if (windows.size > 10_000) {
    const oldest = Array.from(windows.keys()).slice(0, 1000)
    oldest.forEach((k) => windows.delete(k))
  }

  const allowed = hits.length <= maxRequests
  const remaining = Math.max(0, maxRequests - hits.length)
  const resetMs = hits[0] ? hits[0] + windowMs - now : windowMs

  return { allowed, remaining, resetMs }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown'
}
