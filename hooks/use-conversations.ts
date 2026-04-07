"use client"

import { useCallback, useEffect, useState } from "react"

interface Conversation {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

function trpcQuery(proc: string, input?: unknown): string {
  const base = `/api/trpc/${proc}`
  if (input === undefined) return base
  return `${base}?input=${encodeURIComponent(JSON.stringify(input))}`
}

async function trpcMutate(proc: string, input: unknown) {
  const res = await fetch(`/api/trpc/${proc}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await res.json()
  if (data?.error) throw new Error(data.error.message || "tRPC error")
  return data?.result?.data
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(trpcQuery("conversations.list", { limit: 50, offset: 0 }))
      if (res.ok) {
        const data = await res.json()
        const result = data?.result?.data
        setConversations(result || [])
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const createConversation = useCallback(async (model: string): Promise<Conversation> => {
    const conv = await trpcMutate("conversations.create", { model })
    // Normalize dates to strings
    const normalized = {
      ...conv,
      createdAt: typeof conv.createdAt === "string" ? conv.createdAt : new Date(conv.createdAt).toISOString(),
      updatedAt: typeof conv.updatedAt === "string" ? conv.updatedAt : new Date(conv.updatedAt).toISOString(),
      messageCount: 0,
    }
    setConversations((prev) => [normalized, ...prev])
    return normalized
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    await trpcMutate("conversations.delete", { id })
    setConversations((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const renameConversation = useCallback(async (id: string, title: string) => {
    await trpcMutate("conversations.update", { id, title })
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    )
  }, [])

  return {
    conversations,
    loading,
    createConversation,
    deleteConversation,
    renameConversation,
    refresh: fetchConversations,
  }
}
