"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useChat } from "@/hooks/use-chat"
import { useModels } from "@/hooks/use-models"
import { ChatArea } from "@/components/chat/ChatArea"
import { MessageInput } from "@/components/chat/MessageInput"
import { ModelSelector } from "@/components/chat/ModelSelector"

export default function ConversationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const { models } = useModels()
  const {
    messages,
    streamingContent,
    isStreaming,
    error,
    loadConversation,
    sendMessage,
    stopGeneration,
  } = useChat(id)

  const [model, setModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("myagent_last_model") || "gemini-2.5-flash"
    }
    return "gemini-2.5-flash"
  })

  const initialMsgSent = useRef(false)
  const [conversationLoaded, setConversationLoaded] = useState(false)

  useEffect(() => {
    setConversationLoaded(false)
    loadConversation(id).then(() => setConversationLoaded(true))
  }, [id, loadConversation])

  useEffect(() => {
    const msg = searchParams.get("msg")
    if (msg && !initialMsgSent.current && conversationLoaded) {
      initialMsgSent.current = true
      sendMessage(msg, model)
      window.history.replaceState({}, "", `/chat/${id}`)
    }
  }, [searchParams, conversationLoaded, id, model, sendMessage])

  function handleSend(text: string, attachments?: { url: string; type: "image" | "pdf" | "file"; name: string }[]) {
    sendMessage(text, model, attachments)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Chat messages */}
      <ChatArea
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        currentModel={model}
      />

      {/* Error toast */}
      {error && (
        <div className="mx-auto mb-2 w-full max-w-3xl px-4">
          <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-4 py-2 text-center text-sm text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="border-t border-white/5 px-3 py-2 pb-safe sm:px-4 sm:py-3">
        <div className="mx-auto max-w-3xl">
          <div className="mb-1.5 flex items-center gap-2">
            <ModelSelector models={models} value={model} onChange={setModel} compact />
          </div>
          <MessageInput
            onSend={handleSend}
            disabled={isStreaming}
            isStreaming={isStreaming}
            onStop={stopGeneration}
          />
        </div>
      </div>
    </div>
  )
}
