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
          <div className="mb-1.5 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
              AI
            </div>
            <span className="text-xs font-medium text-gray-400">{message.model}</span>
          </div>
        )}
        <div className={`rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 ${
          isUser
            ? "bg-indigo-500/15 text-gray-100"
            : "text-gray-200"
        }`}>
          <div className={`prose prose-invert prose-sm max-w-none ${isUser ? "" : "prose-p:leading-relaxed"}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        </div>
        {!isUser && message.tokensUsed && (
          <div className="mt-1 text-[10px] text-gray-600">{message.tokensUsed.toLocaleString()} tokens</div>
        )}
      </div>
    </div>
  )
}
