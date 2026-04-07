"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MessageBubbleProps {
  message: {
    id: string
    role: string
    content: string
    model: string | null
    tokensUsed: number | null
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={`animate-fade-in flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[70%] ${
          isUser ? "bg-app-user-msg text-white" : "bg-app-card text-gray-100"
        }`}
      >
        {!isUser && message.model && (
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded-md bg-app-accent/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-app-accent">
              {message.model}
            </span>
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}

        {!isUser && message.tokensUsed && (
          <div className="mt-2 text-[10px] text-app-muted">
            {message.tokensUsed.toLocaleString()} tokens
          </div>
        )}
      </div>
    </div>
  )
}
