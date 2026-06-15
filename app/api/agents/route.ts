import { NextRequest, NextResponse } from 'next/server'
import { listAgents, getAgent, deleteAgent } from '@/lib/registry'
import { DeleteAgentSchema } from '@/lib/validation'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(listAgents())
}

export async function DELETE(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = DeleteAgentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 })
  }

  const agent = getAgent(parsed.data.id)
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  deleteAgent(parsed.data.id)
  return NextResponse.json({ success: true })
}
