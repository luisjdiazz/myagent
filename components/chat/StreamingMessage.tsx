"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface StreamingMessageProps {
  content: string
  model?: string
}

export function StreamingMessage({ content, model }: StreamingMessageProps) {
  return (
    <div>
      {model && (
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
            AI
          </div>
          <span className="text-xs font-medium text-gray-400">{model}</span>
        </div>
      )}
      <div className="text-gray-200">
        <div className="prose prose-invert prose-sm prose-p:leading-relaxed max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          <span className="cursor-blink" />
        </div>
      </div>
    </div>
  )
}
