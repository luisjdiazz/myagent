"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { useModels } from "@/hooks/use-models"
import { ModelSelector } from "@/components/chat/ModelSelector"

export default function NewChatPage() {
  const { user } = useAuth()
  const { models, loading: modelsLoading } = useModels()
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [model, setModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("myagent_last_model") || "gemini-2.5-flash"
    }
    return "gemini-2.5-flash"
  })
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = message.trim()
    if (!text || sending) return

    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/trpc/conversations.create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      })
      const data = await res.json()

      if (data?.error) {
        setError(data.error.message || "Failed to create conversation")
        setSending(false)
        return
      }

      const conv = data?.result?.data
      if (conv?.id) {
        router.push(`/chat/${conv.id}?msg=${encodeURIComponent(text)}`)
      } else {
        setError("Failed to create conversation — no ID returned")
        setSending(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
      setSending(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">
            What can I help you with?
          </h2>
          <p className="text-sm text-app-muted">
            Choose a model and start chatting
          </p>
        </div>

        {user && !user.hasApiKey && (
          <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-center text-sm text-yellow-300">
            Configure your KIE.AI API key for personal usage.{" "}
            <button
              onClick={() => router.push("/settings")}
              className="font-medium underline hover:text-yellow-200"
            >
              Go to Settings
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-4 flex justify-center">
          {modelsLoading ? (
            <div className="rounded-lg border border-app-border bg-app-card px-3 py-1.5 text-sm text-app-muted">
              Loading models...
            </div>
          ) : (
            <ModelSelector models={models} value={model} onChange={setModel} />
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Type your message..."
              rows={3}
              className="w-full resize-none rounded-xl border border-app-border bg-app-card px-4 py-3 pr-14 text-sm text-white placeholder-app-muted/50 focus:border-app-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-app-accent text-white transition-colors hover:bg-app-accent-hover disabled:opacity-30"
            >
              {sending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
