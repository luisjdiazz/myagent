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
        className={`max-w-[90%] rounded-2xl px-3 py-2.5 sm:max-w-[75%] sm:px-4 sm:py-3 ${
          isUser ? "bg-app-user-msg text-white" : "bg-app-card text-gray-100"
        }`}
      >
        {!isUser && message.model && (
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-md bg-app-accent/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-app-accent sm:text-[10px]">
              {message.model}
            </span>
          </div>
        )}

        {isUser ? (
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed sm:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-[15px] leading-relaxed sm:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}

        {!isUser && message.tokensUsed && (
          <div className="mt-1.5 text-[9px] text-app-muted sm:text-[10px]">
            {message.tokensUsed.toLocaleString()} tokens
          </div>
        )}
      </div>
    </div>
  )
}
