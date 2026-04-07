"use client"

import { useEffect, useRef, useState } from "react"
import type { ModelInfo } from "@/types"

interface ModelSelectorProps {
  models: ModelInfo[]
  value: string
  onChange: (model: string) => void
  compact?: boolean
}

export function ModelSelector({ models, value, onChange, compact }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const byProvider: Record<string, ModelInfo[]> = {}
  for (const m of models) {
    if (!byProvider[m.provider]) byProvider[m.provider] = []
    byProvider[m.provider].push(m)
  }
  const current = models.find(m => m.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-zinc-400 transition-all duration-200 hover:border-white/[0.12] hover:text-zinc-300 active:scale-95 ${compact ? "text-[12px]" : "text-[13px]"}`}
      >
        <span className="max-w-[140px] truncate sm:max-w-none">{current?.name || value}</span>
        <svg className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 sm:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-[#0f0f11] border-t border-white/[0.06] pb-8 sm:absolute sm:inset-auto sm:bottom-full sm:left-0 sm:mb-2 sm:max-h-80 sm:w-72 sm:rounded-xl sm:border sm:border-white/[0.06] sm:pb-0">
            <div className="sticky top-0 flex justify-center py-3 sm:hidden"><div className="h-1 w-10 rounded-full bg-zinc-700" /></div>
            <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600 sm:pt-2">Select Model</div>
            {Object.keys(byProvider).map(provider => (
              <div key={provider}>
                <div className="px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">{provider}</div>
                {byProvider[provider].map(m => (
                  <button
                    key={m.id}
                    onClick={() => { onChange(m.id); setOpen(false); localStorage.setItem("myagent_last_model", m.id) }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-150 sm:py-2.5 ${
                      m.id === value
                        ? "border-l-2 border-l-indigo-400 bg-transparent text-zinc-200"
                        : "border-l-2 border-l-transparent text-zinc-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[13px]">
                      {m.name}
                      {m.recommended && <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] text-green-400">recommended</span>}
                      {m.status === "intermittent" && <span className="rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[9px] text-yellow-500/80">unstable</span>}
                      {m.type === "image" && <span className="rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[9px] text-purple-400/80">image</span>}
                    </span>
                    <span className="text-[10px] text-zinc-700">{m.cost}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
