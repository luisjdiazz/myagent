"use client"

import { useState } from "react"
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
  const [copied, setCopied] = useState(false)

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`group animate-fade-in ${isUser ? "flex justify-end" : ""}`}>
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
        {!isUser && (
          <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-0 [.touch_&]:opacity-60">
            <button onClick={() => copyToClipboard(message.content)} className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-400" title="Copy">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
