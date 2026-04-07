"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface StreamingMessageProps {
  content: string
  model?: string
}

export function StreamingMessage({ content, model }: StreamingMessageProps) {
  return (
    <div className="animate-fade-in">
      {model && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <span className="text-[11px] font-medium text-zinc-600">{model}</span>
        </div>
      )}
      <div className="text-zinc-200">
        <div className="prose prose-invert prose-sm prose-p:leading-relaxed max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          <span className="cursor-blink" />
        </div>
      </div>
    </div>
  )
}
