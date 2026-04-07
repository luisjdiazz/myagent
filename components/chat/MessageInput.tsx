"use client"

import { FormEvent, KeyboardEvent, useCallback, useRef, useState } from "react"

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
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if ((!trimmed && attachments.length === 0) || disabled) return
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
      el.style.height = Math.min(el.scrollHeight, 160) + "px"
    }
  }

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        setIsRecording(false)
        setIsTranscribing(true)

        try {
          const formData = new FormData()
          formData.append("audio", blob, "recording.webm")
          const res = await fetch("/api/transcribe", { method: "POST", body: formData })
          const data = await res.json()
          if (data.text) {
            setText((prev) => (prev ? prev + " " + data.text : data.text))
            textareaRef.current?.focus()
          } else if (data.error) {
            console.error("Transcription error:", data.error)
          }
        } catch (err) {
          console.error("Transcription failed:", err)
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      console.error("Microphone access denied")
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

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
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div key={i} className="relative group flex items-center gap-1.5 rounded-lg bg-app-card border border-app-border px-2 py-1.5">
              {att.type === "image" ? (
                <img src={att.url} alt={att.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <svg className="h-5 w-5 text-app-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span className="max-w-[100px] truncate text-xs text-app-muted">{att.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="ml-1 rounded-full p-0.5 text-app-muted hover:bg-red-500/20 hover:text-red-400"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2">
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-app-border bg-app-card text-app-muted transition-colors hover:text-white disabled:opacity-30"
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
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={disabled}
            placeholder={isTranscribing ? "Transcribing..." : "Type a message..."}
            rows={1}
            className="w-full resize-none rounded-xl border border-app-border bg-app-card px-3 py-3 pr-2 text-sm text-white placeholder-app-muted/50 focus:border-app-accent focus:outline-none sm:px-4"
          />
        </div>

        {/* Voice recording button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isTranscribing}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            isRecording
              ? "border-red-500 bg-red-500/20 text-red-400 animate-pulse"
              : "border-app-border bg-app-card text-app-muted hover:text-white"
          } disabled:opacity-30`}
          title={isRecording ? "Stop recording" : "Voice message"}
        >
          {isTranscribing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-app-muted border-t-transparent" />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white transition-colors hover:bg-red-600"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={(!text.trim() && attachments.length === 0) || disabled}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-app-accent text-white transition-colors hover:bg-app-accent-hover disabled:opacity-30"
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
