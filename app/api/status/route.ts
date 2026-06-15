import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const openrouter = !!process.env.OPENROUTER_API_KEY
  const anthropic = !!process.env.ANTHROPIC_API_KEY
  return NextResponse.json({
    ai: openrouter || anthropic,
    openrouter,
    anthropic,
    github: !!process.env.GITHUB_TOKEN,
    vercel: !!process.env.VERCEL_TOKEN,
    provider: openrouter ? 'openrouter' : anthropic ? 'anthropic' : null,
  })
}
