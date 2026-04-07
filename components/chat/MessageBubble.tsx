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
    <div className={`animate-fade-in ${isUser ? "flex justify-end" : ""}`}>
      <div className={`${isUser ? "max-w-[85%] sm:max-w-[70%]" : "w-full"}`}>
        {!isUser && message.model && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span className="text-[11px] font-medium text-zinc-600">{message.model}</span>
          </div>
        )}
        <div className={`rounded-2xl ${
          isUser
            ? "bg-indigo-400/[0.08] px-3.5 py-2.5 sm:px-4 sm:py-3"
            : ""
        }`}>
          <div className={`prose prose-invert prose-sm max-w-none prose-p:leading-relaxed ${
            isUser ? "text-zinc-100" : "text-zinc-200"
          }`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        </div>
        {!isUser && message.tokensUsed && (
          <div className="mt-1.5 text-[10px] text-zinc-700">{message.tokensUsed.toLocaleString()} tokens</div>
        )}
      </div>
    </div>
  )
}
