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
      <div className="flex h-screen items-center justify-center bg-app-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app-bg px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="rounded-lg p-2 text-app-muted hover:bg-app-card hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
              message.type === "success"
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile */}
        <div className="mb-6 rounded-xl border border-app-border bg-app-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Profile</h2>

          <div className="mb-3">
            <label className="mb-1 block text-xs text-app-muted">Email</label>
            <input
              type="email"
              value={supabaseUser.email || ""}
              disabled
              className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-2.5 text-sm text-app-muted"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs text-app-muted">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-2.5 text-sm text-white focus:border-app-accent focus:outline-none"
            />
          </div>

          <button
            onClick={handleSaveName}
            disabled={saving || name === user?.name}
            className="rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-accent-hover disabled:opacity-50"
          >
            Save Name
          </button>
        </div>

        {/* API Key */}
        <div className="rounded-xl border border-app-border bg-app-card p-5">
          <h2 className="mb-2 text-sm font-semibold text-white">KIE.AI API Key</h2>
          <p className="mb-4 text-xs text-app-muted">
            Your API key is stored securely. A default platform key is available, but you can use your own for unlimited access.
          </p>

          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-app-muted">Status:</span>
            {user?.hasApiKey ? (
              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                Custom Key
              </span>
            ) : (
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                Using Platform Key
              </span>
            )}
          </div>

          <div className="mb-4">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={user?.hasApiKey ? "Enter new key to update..." : "Paste your KIE.AI API key..."}
              className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-2.5 text-sm text-white placeholder-app-muted/50 focus:border-app-accent focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveApiKey}
              disabled={saving || !apiKey.trim()}
              className="rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-accent-hover disabled:opacity-50"
            >
              {user?.hasApiKey ? "Update Key" : "Save Key"}
            </button>
            {user?.hasApiKey && (
              <button
                onClick={handleRemoveApiKey}
                disabled={saving}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
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
