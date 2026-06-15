import { NextRequest, NextResponse } from 'next/server'
import { listAgents, getAgent, deleteAgent } from '@/lib/registry'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(listAgents())
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const agent = getAgent(id)
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  deleteAgent(id)
  return NextResponse.json({ success: true })
}
