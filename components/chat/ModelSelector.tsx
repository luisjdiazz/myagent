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
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const modelsByProvider: Record<string, ModelInfo[]> = {}
  for (const m of models) {
    if (!modelsByProvider[m.provider]) modelsByProvider[m.provider] = []
    modelsByProvider[m.provider].push(m)
  }

  const providers = Object.keys(modelsByProvider)
  const currentModel = models.find((m) => m.id === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg border border-app-border bg-app-card px-3 py-1.5 text-sm text-white transition-colors hover:border-app-muted ${
          compact ? "text-xs" : ""
        }`}
      >
        <span className="truncate">{currentModel?.name || value}</span>
        {currentModel?.cost && (
          <span className="text-[10px] text-app-muted">{currentModel.cost}</span>
        )}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 max-h-80 w-72 overflow-y-auto rounded-xl border border-app-border bg-app-sidebar shadow-xl">
          {providers.map((provider) => (
            <div key={provider}>
              <div className="sticky top-0 bg-app-sidebar px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-app-muted">
                {provider}
              </div>
              {modelsByProvider[provider].map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onChange(model.id)
                    setOpen(false)
                    if (typeof window !== "undefined") {
                      localStorage.setItem("myagent_last_model", model.id)
                    }
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-app-card ${
                    model.id === value ? "bg-app-accent/10 text-app-accent" : "text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {model.name}
                    {model.status === "intermittent" && (
                      <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-medium text-yellow-400">
                        unstable
                      </span>
                    )}
                    {model.type === "image" && (
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-medium text-purple-400">
                        image
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-app-muted">{model.cost}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
