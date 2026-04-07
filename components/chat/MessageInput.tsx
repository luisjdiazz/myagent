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
  const [speechLang, setSpeechLang] = useState<"en-US" | "es-ES">("en-US")
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
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = speechLang
      let finalTranscript = ""
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (e: any) => {
        let interim = ""
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript + " "
          } else {
            interim += e.results[i][0].transcript
          }
        }
        setText(finalTranscript + interim)
      }
      recognition.onend = () => {
        // Only clear listening if we intentionally stopped
        if (recognitionRef.current === null) return
        setIsListening(false)
      }
      recognition.onerror = () => setIsListening(false)
      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)
    } catch {
      setIsListening(false)
    }
  }

  function stopListening() {
    const rec = recognitionRef.current
    recognitionRef.current = null
    rec?.stop()
    setIsListening(false)
  }

  function toggleLang() {
    setSpeechLang(prev => prev === "en-US" ? "es-ES" : "en-US")
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
            <div key={i} className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-[12px] text-zinc-300">
              {a.type === "image" ? (
                <img src={a.url} alt="" className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              )}
              <span className="max-w-[100px] truncate">{a.name}</span>
              <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))} className="ml-0.5 text-zinc-600 hover:text-zinc-300 transition-colors">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {isListening && (
        <div className="mb-2 flex items-center gap-2 text-[12px] text-zinc-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
          </span>
          Listening...
        </div>
      )}

      <div className={`flex items-end gap-2 rounded-2xl border bg-white/[0.03] p-2 transition-all duration-200 ${
        isListening
          ? "animate-recording-glow border-indigo-400/30"
          : "border-white/[0.06] focus-within:border-indigo-400/30"
      }`}>
        {/* Attach */}
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={handleFiles} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:text-zinc-300 active:scale-95 disabled:opacity-30"
        >
          {isUploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
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
          className="min-h-[36px] max-h-[150px] flex-1 resize-none bg-transparent text-[14px] leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none"
        />

        {/* Language toggle pill */}
        <button
          type="button"
          onClick={toggleLang}
          className="flex h-7 shrink-0 items-center justify-center rounded-full bg-white/[0.04] px-2 text-[10px] font-medium text-zinc-500 transition-colors hover:text-zinc-300 hover:bg-white/[0.08]"
          title="Toggle speech language"
        >
          {speechLang === "en-US" ? "EN" : "ES"}
        </button>

        {/* Right button: Stop streaming > Stop recording + Send > Send > Mic */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-400/10 text-red-400 transition hover:bg-red-400/20 active:scale-95"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
          </button>
        ) : isListening ? (
          /* While recording: show stop mic button + send button */
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={stopListening}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-400/10 text-indigo-400 transition hover:bg-indigo-400/20 active:scale-95"
              title="Stop recording"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            </button>
            {hasContent && (
              <button
                type="button"
                onClick={(e) => { stopListening(); handleSubmit(e as unknown as FormEvent) }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-400 text-white transition hover:bg-indigo-300 active:scale-95"
                title="Stop & send"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            )}
          </div>
        ) : hasContent ? (
          <button
            type="button"
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-400 text-white transition hover:bg-indigo-300 active:scale-95 disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={startListening}
            disabled={disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:text-zinc-300 active:scale-95 disabled:opacity-30"
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
