"use client"

import { useEffect, useState } from "react"
import type { ModelInfo } from "@/types"

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("/api/trpc/models.list")
        if (res.ok) {
          const data = await res.json()
          setModels(data?.result?.data || [])
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false)
      }
    }
    fetchModels()
  }, [])

  const modelsByProvider: Record<string, ModelInfo[]> = {}
  for (const m of models) {
    if (!modelsByProvider[m.provider]) modelsByProvider[m.provider] = []
    modelsByProvider[m.provider].push(m)
  }

  return { models, modelsByProvider, loading }
}
