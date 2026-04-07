"use client"

import { useEffect, useRef } from "react"
import { MessageBubble } from "./MessageBubble"
import { StreamingMessage } from "./StreamingMessage"

interface Message {
  id: string
  role: string
  content: string
  model: string | null
  tokensUsed: number | null
}

interface ChatAreaProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
  currentModel?: string
}

export function ChatArea({ messages, streamingContent, isStreaming, currentModel }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && streamingContent && (
          <StreamingMessage content={streamingContent} model={currentModel} />
        )}

        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-app-card px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-app-muted [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-app-muted [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-app-muted [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
