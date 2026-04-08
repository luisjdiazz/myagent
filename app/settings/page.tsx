"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"

export default function SettingsPage() {
  const { user, supabaseUser, loading, refreshUser } = useAuth()
  const router = useRouter()

  const [name, setName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!loading && !supabaseUser) router.replace("/login")
    if (user) setName(user.name)
  }, [user, supabaseUser, loading, router])

  async function handleSaveName() {
    setSaving(true)
    setMessage(null)
    try {
      await fetch("/api/trpc/user.update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      await refreshUser()
      setMessage({ type: "success", text: "Name updated" })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveApiKey() {
    setSaving(true)
    setMessage(null)
    try {
      await fetch("/api/trpc/user.update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kieApiKey: apiKey }),
      })
      await refreshUser()
      setApiKey("")
      setMessage({ type: "success", text: "API key saved" })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" })
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveApiKey() {
    setSaving(true)
    setMessage(null)
    try {
      await fetch("/api/trpc/user.update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kieApiKey: "" }),
      })
      await refreshUser()
      setMessage({ type: "success", text: "API key removed" })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !supabaseUser) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#09090b]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#09090b] px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="rounded-lg p-2 text-zinc-600 transition-colors hover:text-zinc-400"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-lg font-medium tracking-tight text-white">Settings</h1>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`mb-5 rounded-xl px-4 py-2.5 text-[13px] ${
              message.type === "success"
                ? "border border-green-500/[0.06] bg-green-500/[0.03] text-green-400/80"
                : "border border-red-400/[0.06] bg-red-400/[0.04] text-red-400/80"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile card */}
        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-[14px] font-medium text-white">Profile</h2>

          <div className="mb-3">
            <label className="mb-1.5 block text-[12px] text-zinc-600">Email</label>
            <input
              type="email"
              value={supabaseUser.email || ""}
              disabled
              className="w-full rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 text-[14px] text-zinc-600"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] text-zinc-600">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-zinc-100 transition-all duration-200 focus:border-indigo-400/30 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSaveName}
            disabled={saving || name === user?.name}
            className="rounded-xl bg-indigo-400 px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-indigo-300 disabled:opacity-40"
          >
            Save Name
          </button>
        </div>

        {/* API Key card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="mb-1.5 text-[14px] font-medium text-white">KIE.AI API Key</h2>
          <p className="mb-2 text-[12px] text-zinc-600">
            Each user needs their own KIE.AI API key to use the platform.
          </p>
          <p className="mb-4 text-[12px] text-zinc-600">
            Don&apos;t have a key?{" "}
            <a
              href="https://kie.ai?ref=6b535629e76d411688f169e9ffd2dc2a"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Create your KIE.AI account →
            </a>
            {" "}then generate an API key from your dashboard.
          </p>

          <div className="mb-3 flex items-center gap-2">
            <span className="text-[12px] text-zinc-600">Status:</span>
            {user?.hasApiKey ? (
              <span className="rounded-full bg-green-500/[0.06] px-2.5 py-0.5 text-[11px] text-green-400/80">
                Configured
              </span>
            ) : (
              <span className="rounded-full bg-yellow-500/[0.06] px-2.5 py-0.5 text-[11px] text-yellow-400/80">
                Not Set
              </span>
            )}
          </div>

          <div className="mb-4">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={user?.hasApiKey ? "Enter new key to update..." : "Paste your KIE.AI API key..."}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-zinc-100 placeholder-zinc-600 transition-all duration-200 focus:border-indigo-400/30 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveApiKey}
              disabled={saving || !apiKey.trim()}
              className="rounded-xl bg-indigo-400 px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-indigo-300 disabled:opacity-40"
            >
              {user?.hasApiKey ? "Update Key" : "Save Key"}
            </button>
            {user?.hasApiKey && (
              <button
                onClick={handleRemoveApiKey}
                disabled={saving}
                className="rounded-xl border border-red-400/[0.08] px-4 py-2 text-[13px] font-medium text-red-400/80 transition-all duration-200 hover:bg-red-400/[0.06] disabled:opacity-40"
              >
                Remove Key
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
