"use client"

import { FormEvent, KeyboardEvent, useRef, useState } from "react"

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
  const [isUploading, setIsUploading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if ((!trimmed && attachments.length === 0) || disabled) return
    if (isListening) stopListening()
    onSend(trimmed, attachments.length > 0 ? attachments : undefined)
    setText("")
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function autoResize() {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = Math.min(el.scrollHeight, 150) + "px"
    }
  }

  // --- Voice (Web Speech API) ---
  function startListening() {
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) return
      const recognition = new SR()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = ""
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (e: any) => {
        let t = ""
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
        setText(t)
      }
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)
      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
    }
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  // --- File upload ---
  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    setIsUploading(true)
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (data.url) setAttachments(prev => [...prev, { url: data.url, type: data.type, name: data.name }])
      } catch { /* skip */ }
    }
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const hasContent = text.trim().length > 0 || attachments.length > 0

  return (
    <div>
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-gray-300">
              {a.type === "image" ? (
                <img src={a.url} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <span>📄</span>
              )}
              <span className="max-w-[100px] truncate">{a.name}</span>
              <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))} className="text-gray-500 hover:text-white">✕</button>
            </div>
          ))}
        </div>
      )}

      {isListening && (
        <div className="mb-2 flex items-center gap-2 text-sm text-red-400">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          Listening — tap mic to stop
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm">
        {/* Attach */}
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={handleFiles} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:text-white active:scale-95 disabled:opacity-30"
        >
          {isUploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize() }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Message..."
          rows={1}
          className="min-h-[36px] max-h-[150px] flex-1 resize-none bg-transparent text-[15px] leading-snug text-white placeholder-gray-500 outline-none sm:text-sm"
        />

        {/* Mic or Send or Stop */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition active:scale-95"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
          </button>
        ) : hasContent ? (
          <button
            type="button"
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:bg-indigo-400 active:scale-95 disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={disabled}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-30 ${
              isListening ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 016 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any } }
