"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Conversation {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

interface ChatSidebarProps {
  conversations: Conversation[]
  activeId?: string
  onNewChat: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onClose?: () => void
}

function groupByDate(conversations: Conversation[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ]

  for (const c of conversations) {
    const d = new Date(c.updatedAt)
    if (d >= today) groups[0].items.push(c)
    else if (d >= yesterday) groups[1].items.push(c)
    else if (d >= weekAgo) groups[2].items.push(c)
    else groups[3].items.push(c)
  }

  return groups.filter((g) => g.items.length > 0)
}

export function ChatSidebar({
  conversations,
  activeId,
  onNewChat,
  onDelete,
  onRename,
  onClose,
}: ChatSidebarProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [menuId, setMenuId] = useState<string | null>(null)
  const groups = groupByDate(conversations)

  function startRename(c: Conversation) {
    setEditingId(c.id)
    setEditTitle(c.title)
    setMenuId(null)
  }

  function finishRename(id: string) {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0a0c]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-700">Chats</span>
        <div />
      </div>

      {/* New chat button */}
      <div className="px-3 pb-3">
        <button
          onClick={onNewChat}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-zinc-300 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06] active:scale-[0.98]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-700">
              {group.label}
            </div>
            {group.items.map((c) => (
              <div
                key={c.id}
                className={`group relative mb-0.5 rounded-lg transition-all duration-150 ${
                  c.id === activeId
                    ? "border-l-2 border-l-indigo-400 bg-white/[0.04] text-zinc-200"
                    : "border-l-2 border-l-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                }`}
              >
                {editingId === c.id ? (
                  <div className="px-3 py-2.5">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => finishRename(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") finishRename(c.id)
                        if (e.key === "Escape") setEditingId(null)
                      }}
                      autoFocus
                      className="w-full bg-transparent text-[13px] text-zinc-200 outline-none"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      router.push(`/chat/${c.id}`)
                      onClose?.()
                    }}
                    className="flex min-h-[44px] w-full items-center px-3 py-2.5 text-left"
                  >
                    <span className="block truncate text-[13px]">{c.title}</span>
                  </button>
                )}

                {/* Actions (visible on hover / always on active) */}
                <div className={`absolute right-1.5 top-1/2 -translate-y-1/2 ${c.id === activeId ? "flex" : "hidden group-hover:flex"}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuId(menuId === c.id ? null : c.id)
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>
                </div>

                {menuId === c.id && (
                  <div className="absolute right-0 top-10 z-50 w-36 rounded-xl border border-white/[0.06] bg-[#0f0f11] py-1 shadow-2xl">
                    <button
                      onClick={() => startRename(c)}
                      className="flex min-h-[44px] w-full items-center px-3 text-left text-[13px] text-zinc-300 hover:bg-white/[0.04] transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        onDelete(c.id)
                        setMenuId(null)
                      }}
                      className="flex min-h-[44px] w-full items-center px-3 text-left text-[13px] text-red-400 hover:bg-white/[0.04] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {conversations.length === 0 && (
          <p className="px-2 py-12 text-center text-[12px] text-zinc-700">
            No conversations yet
          </p>
        )}
      </div>

      {/* Settings */}
      <div className="px-3 pb-3 pt-2">
        <button
          onClick={() => router.push("/settings")}
          className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>
    </div>
  )
}
