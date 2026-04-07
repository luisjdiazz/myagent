"use client"

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react"

interface Attachment {
  url: string
  type: "image" | "pdf" | "file"
  name: string
}

interface MessageInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void
  disabled?: boolean
  isStreaming?: boolean
  onStop?: () => void
}

export function MessageInput({ onSend, disabled, isStreaming, onStop }: MessageInputProps) {
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // Check for Speech Recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "auto"

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = ""
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setText(transcript)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if ((!trimmed && attachments.length === 0) || disabled) return
    // Stop listening if active
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
    onSend(trimmed, attachments.length > 0 ? attachments : undefined)
    setText("")
    setAttachments([])
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = Math.min(el.scrollHeight, 120) + "px"
    }
  }

  // Voice recognition toggle
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setText("")
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  // File upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (data.url) {
          setAttachments((prev) => [...prev, { url: data.url, type: data.type, name: data.name }])
        }
      }
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachments.map((att, i) => (
            <div key={i} className="relative flex items-center gap-1.5 rounded-lg border border-app-border bg-app-card px-2 py-1.5">
              {att.type === "image" ? (
                <img src={att.url} alt={att.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <svg className="h-5 w-5 text-app-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span className="max-w-[80px] truncate text-xs text-app-muted">{att.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="ml-0.5 rounded-full p-0.5 text-app-muted hover:text-red-400 active:bg-red-500/20"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center gap-2 px-1 text-xs text-red-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Listening... speak now
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-1.5">
        {/* File upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-app-muted transition-colors hover:text-white active:bg-app-card disabled:opacity-30 sm:h-11 sm:w-11"
          title="Upload image or PDF"
        >
          {isUploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-app-muted border-t-transparent" />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>

        {/* Text input */}
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={disabled}
            placeholder={isListening ? "Listening..." : "Message..."}
            rows={1}
            className="w-full resize-none rounded-2xl border border-app-border bg-app-card px-3 py-2.5 text-[15px] leading-snug text-white placeholder-app-muted/50 focus:border-app-accent focus:outline-none sm:px-4 sm:py-3 sm:text-sm"
            style={{ maxHeight: 120 }}
          />
        </div>

        {/* Voice / Send / Stop buttons */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition-colors active:bg-red-600 sm:h-11 sm:w-11"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : text.trim() || attachments.length > 0 ? (
          <button
            type="submit"
            disabled={disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-accent text-white transition-colors active:bg-app-accent-hover disabled:opacity-30 sm:h-11 sm:w-11"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        ) : speechSupported ? (
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors sm:h-11 sm:w-11 ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "text-app-muted active:bg-app-card hover:text-white"
            } disabled:opacity-30`}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-accent text-white opacity-30 sm:h-11 sm:w-11"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </form>
    </div>
  )
}

// TypeScript declarations for Web Speech API
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
