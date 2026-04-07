"use client"

import { useCallback, useRef, useState } from "react"

interface Attachment {
  url: string
  type: "image" | "pdf" | "file"
  name: string
}

interface Message {
  id: string
  role: string
  content: string
  model: string | null
  tokensUsed: number | null
  createdAt: string
}

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState("New Chat")
  const abortRef = useRef<AbortController | null>(null)

  const loadConversation = useCallback(async (id: string) => {
    try {
      const url = `/api/trpc/conversations.getById?input=${encodeURIComponent(JSON.stringify({ id }))}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const conv = data?.result?.data
        if (conv) {
          setMessages(conv.messages || [])
          setConversationTitle(conv.title)
          setError(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string, model?: string, attachments?: Attachment[]) => {
      if (!conversationId || isStreaming) return

      setError(null)
      setIsStreaming(true)
      setStreamingContent("")

      // Build content with attachments
      let fullContent = text
      if (attachments && attachments.length > 0) {
        const parts: string[] = []
        for (const att of attachments) {
          if (att.type === "image") {
            parts.push(`![${att.name}](${att.url})`)
          } else {
            parts.push(`[Attached: ${att.name}](${att.url})`)
          }
        }
        fullContent = parts.join("\n") + (text ? "\n\n" + text : "")
      }

      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: fullContent,
        model: null,
        tokensUsed: null,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])

      // Handle image generation
      if (model === "gpt-image") {
        try {
          setStreamingContent("Generating image...")
          const genRes = await fetch("/api/images/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: text, conversationId }),
          })
          const genData = await genRes.json()
          if (genData.error) {
            setError(genData.detail || "Image generation failed")
            setIsStreaming(false)
            setStreamingContent("")
            return
          }
          const taskId = genData.taskId
          if (!taskId) {
            setError("No task ID returned")
            setIsStreaming(false)
            setStreamingContent("")
            return
          }

          let imageUrl: string | null = null
          for (let i = 0; i < 40; i++) {
            await new Promise((r) => setTimeout(r, 5000))
            const statusRes = await fetch(`/api/images/${taskId}`)
            const status = await statusRes.json()
            const taskData = status.data
            if (!taskData) continue
            const flag = taskData.successFlag as number
            const progress = taskData.progress as string | undefined
            if (flag === 1) {
              const response = taskData.response as Record<string, unknown> | undefined
              const urls = (response?.resultUrls || response?.result_urls) as string[] | undefined
              imageUrl = urls?.[0] || null
              break
            }
            if (flag === 2) {
              setError((taskData.errorMessage as string) || "Image generation failed")
              setIsStreaming(false)
              setStreamingContent("")
              return
            }
            const pct = progress ? `${Math.round(parseFloat(progress) * 100)}%` : ""
            setStreamingContent(`Generating image... ${pct} (${(i + 1) * 5}s)`)
          }

          const content = imageUrl
            ? `![Generated Image](${imageUrl})`
            : "Image generation timed out"
          const assistantMsg: Message = {
            id: `img-${Date.now()}`,
            role: "assistant",
            content,
            model: "gpt-image",
            tokensUsed: null,
            createdAt: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, assistantMsg])
          setStreamingContent("")
          setIsStreaming(false)
          return
        } catch (err) {
          setError(err instanceof Error ? err.message : "Image generation error")
          setIsStreaming(false)
          setStreamingContent("")
          return
        }
      }

      // Regular streaming chat
      try {
        const controller = new AbortController()
        abortRef.current = controller

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message: fullContent, model }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          setError(errData.error || `HTTP ${response.status}`)
          setIsStreaming(false)
          setStreamingContent("")
          return
        }

        if (!response.body) {
          throw new Error("No response body")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let streamedContent = ""

        const CHUNK_TIMEOUT_MS = 60_000
        while (true) {
          const timeoutId = setTimeout(() => controller.abort(), CHUNK_TIMEOUT_MS)
          const { done, value } = await reader.read()
          clearTimeout(timeoutId)
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith("data: ")) continue

            try {
              const data = JSON.parse(trimmed.slice(6))

              if (data.error) {
                setError(typeof data.error === "string" ? data.error : data.error.detail || "API error")
                setIsStreaming(false)
                setStreamingContent("")
                return
              }

              if (data.token) {
                streamedContent += data.token
                setStreamingContent(streamedContent)
              }

              if (data.done) {
                const assistantMsg: Message = {
                  id: data.message_id || `msg-${Date.now()}`,
                  role: "assistant",
                  content: streamedContent,
                  model: model || null,
                  tokensUsed: data.tokens_used ?? null,
                  createdAt: new Date().toISOString(),
                }
                setMessages((prev) => [...prev, assistantMsg])
                setStreamingContent("")
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message)
        }
      } finally {
        abortRef.current = null
        setIsStreaming(false)
        setStreamingContent("")
      }
    },
    [conversationId, isStreaming]
  )

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setStreamingContent("")
  }, [])

  return {
    messages,
    streamingContent,
    isStreaming,
    error,
    conversationTitle,
    loadConversation,
    sendMessage,
    stopGeneration,
  }
}
