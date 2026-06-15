import type { Agent } from './types'

// In-memory store — persists for the lifetime of the server process.
// On Vercel, this resets on cold starts. Swap for a real DB in production.
const store = new Map<string, Agent>()

export function listAgents(): Agent[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getAgent(id: string): Agent | undefined {
  return store.get(id)
}

export function saveAgent(agent: Agent): Agent {
  store.set(agent.id, agent)
  return agent
}

export function deleteAgent(id: string): boolean {
  return store.delete(id)
}
