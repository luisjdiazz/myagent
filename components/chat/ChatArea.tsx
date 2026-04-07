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
    <div className="flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto max-w-[720px] space-y-5 px-4 py-5 sm:py-8">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && streamingContent && (
          <StreamingMessage content={streamingContent} model={currentModel} />
        )}
        {isStreaming && !streamingContent && (
          <div className="flex gap-1 py-2">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-600 [animation-delay:300ms]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
