'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Agent } from '@/lib/types'

const STORAGE_KEY = 'agent-prospector:agents'

interface AgentStore {
  agents: Agent[]
  saveAgent: (agent: Agent) => void
  deleteAgent: (id: string) => void
  getAgent: (id: string) => Agent | undefined
}

const Ctx = createContext<AgentStore>({
  agents: [],
  saveAgent: () => {},
  deleteAgent: () => {},
  getAgent: () => undefined,
})

export function AgentStoreProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setAgents(JSON.parse(raw))
    } catch {}
  }, [])

  // Persist to localStorage whenever agents change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
    } catch {}
  }, [agents])

  const saveAgent = useCallback((agent: Agent) => {
    setAgents((prev) => {
      const idx = prev.findIndex((a) => a.id === agent.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = agent
        return next
      }
      return [agent, ...prev]
    })
  }, [])

  const deleteAgent = useCallback((id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const getAgent = useCallback(
    (id: string) => agents.find((a) => a.id === id),
    [agents]
  )

  return (
    <Ctx.Provider value={{ agents, saveAgent, deleteAgent, getAgent }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAgentStore() {
  return useContext(Ctx)
}
