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

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/trpc/conversations.list?input=" + encodeURIComponent(JSON.stringify({ limit: 50, offset: 0 })))
      if (res.ok) {
        const data = await res.json()
        setConversations(data?.result?.data || [])
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
    const res = await fetch("/api/trpc/conversations.create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    })
    const data = await res.json()
    const conv = data?.result?.data
    setConversations((prev) => [conv, ...prev])
    return conv
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    await fetch("/api/trpc/conversations.delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setConversations((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const renameConversation = useCallback(async (id: string, title: string) => {
    await fetch("/api/trpc/conversations.update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title }),
    })
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
