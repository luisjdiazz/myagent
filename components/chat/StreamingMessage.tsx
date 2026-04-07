"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface StreamingMessageProps {
  content: string
  model?: string
}

export function StreamingMessage({ content, model }: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-app-card px-4 py-3 text-gray-100 md:max-w-[70%]">
        {model && (
          <div className="mb-1.5">
            <span className="rounded-md bg-app-accent/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-app-accent">
              {model}
            </span>
          </div>
        )}
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          {content && <span className="cursor-blink" />}
        </div>
      </div>
    </div>
  )
}
