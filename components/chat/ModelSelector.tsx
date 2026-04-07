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

  // Prevent body scroll when dropdown is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

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
        className={`flex items-center gap-1.5 rounded-lg border border-app-border bg-app-card px-2.5 py-1.5 text-white transition-colors active:bg-app-sidebar sm:gap-2 sm:px-3 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <span className="max-w-[150px] truncate sm:max-w-none">
          {currentModel?.name || value}
        </span>
        <svg
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Mobile: bottom sheet overlay */}
          <div className="fixed inset-0 z-40 bg-black/50 sm:hidden" onClick={() => setOpen(false)} />

          {/* Mobile: bottom sheet / Desktop: dropdown */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-app-border bg-app-sidebar pb-safe sm:absolute sm:inset-auto sm:bottom-full sm:left-0 sm:mb-2 sm:max-h-80 sm:w-72 sm:rounded-xl sm:border sm:pb-0">
            {/* Mobile drag handle */}
            <div className="sticky top-0 flex justify-center bg-app-sidebar py-2 sm:hidden">
              <div className="h-1 w-8 rounded-full bg-app-muted/30" />
            </div>

            {providers.map((provider) => (
              <div key={provider}>
                <div className="sticky top-0 bg-app-sidebar px-4 py-2 text-xs font-semibold uppercase tracking-wider text-app-muted sm:px-3 sm:py-1.5">
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
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors active:bg-app-card sm:px-3 sm:py-2 sm:text-sm ${
                      model.id === value ? "bg-app-accent/10 text-app-accent" : "text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[15px] sm:text-sm">
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
        </>
      )}
    </div>
  )
}
