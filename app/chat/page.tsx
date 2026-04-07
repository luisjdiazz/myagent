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
      <div className="w-full max-w-2xl space-y-6">
        {/* Heading */}
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white">
          What can I help with?
        </h2>

        {/* API key warning */}
        {user && !user.hasApiKey && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-4 text-center">
            <p className="text-sm text-yellow-300/90">
              You need to configure your KIE.AI API key to start chatting.
            </p>
            <button
              onClick={() => router.push("/settings")}
              className="mt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              Go to Settings &rarr;
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Model selector */}
        <div className="flex justify-center">
          {modelsLoading ? (
            <div className="rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-xs text-gray-500">
              Loading models...
            </div>
          ) : (
            <ModelSelector models={models} value={model} onChange={setModel} />
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit}>
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] transition-colors focus-within:border-indigo-500/40">
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
              className="w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm text-white placeholder-gray-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white transition-all hover:bg-indigo-400 disabled:opacity-20 disabled:hover:bg-indigo-500"
            >
              {sending ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
