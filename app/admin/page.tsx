"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"

interface UserStats {
  id: string
  email: string
  name: string
  hasApiKey: boolean
  createdAt: string
  messagesToday: number
  messagesWeek: number
  messagesTotal: number
  tokensTotal: number
  lastActive: string | null
}

const ADMIN_EMAIL = "luisjdiazpromo@gmail.com"

export default function AdminPage() {
  const { supabaseUser, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserStats[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && (!supabaseUser || supabaseUser.email !== ADMIN_EMAIL)) {
      router.replace("/chat")
    }
  }, [supabaseUser, loading, router])

  useEffect(() => {
    if (supabaseUser?.email === ADMIN_EMAIL) {
      fetch("/api/admin/stats")
        .then(r => r.json())
        .then(data => { setUsers(data.users || []); setFetching(false) })
        .catch(() => setFetching(false))
    }
  }, [supabaseUser])

  if (loading || !supabaseUser || supabaseUser.email !== ADMIN_EMAIL) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#09090b]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    )
  }

  const totalUsers = users.length
  const totalToday = users.reduce((s, u) => s + u.messagesToday, 0)
  const totalTokens = users.reduce((s, u) => s + u.tokensTotal, 0)
  const estimatedCost = (totalTokens * 0.00003).toFixed(2)

  return (
    <div className="min-h-[100dvh] bg-[#09090b] px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight text-white">Admin Dashboard</h1>
            <p className="text-[13px] text-zinc-600">User activity & usage</p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="rounded-lg px-3 py-1.5 text-[13px] text-zinc-500 transition hover:text-zinc-300"
          >
            ← Back to chat
          </button>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-widest text-zinc-600">Users</p>
            <p className="mt-1 text-xl font-medium text-white">{totalUsers}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-widest text-zinc-600">Messages Today</p>
            <p className="mt-1 text-xl font-medium text-white">{totalToday}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-widest text-zinc-600">Total Tokens</p>
            <p className="mt-1 text-xl font-medium text-white">{(totalTokens / 1000).toFixed(1)}k</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-widest text-zinc-600">Est. Cost</p>
            <p className="mt-1 text-xl font-medium text-white">${estimatedCost}</p>
          </div>
        </div>

        {/* Users table */}
        {fetching ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-2">
            {users.sort((a, b) => b.messagesTotal - a.messagesTotal).map(u => (
              <div key={u.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-medium text-zinc-200">{u.name || "No name"}</p>
                    <p className="text-[12px] text-zinc-600">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.hasApiKey ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] text-green-400">API Key ✓</span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400">No Key</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-700">Today</p>
                    <p className="text-[13px] text-zinc-300">{u.messagesToday}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-700">This Week</p>
                    <p className="text-[13px] text-zinc-300">{u.messagesWeek}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-700">Total</p>
                    <p className="text-[13px] text-zinc-300">{u.messagesTotal}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-700">Tokens</p>
                    <p className="text-[13px] text-zinc-300">{(u.tokensTotal / 1000).toFixed(1)}k</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-700">Last Active</p>
                    <p className="text-[13px] text-zinc-300">{u.lastActive ? new Date(u.lastActive).toLocaleDateString() : "Never"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
