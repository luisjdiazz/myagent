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
    <div className="flex h-full flex-col bg-app-sidebar">
      <div className="flex items-center justify-between p-3">
        <h2 className="text-sm font-semibold text-white">Chats</h2>
        <div className="flex gap-1">
          <button
            onClick={onNewChat}
            className="rounded-lg p-2 text-app-muted transition-colors hover:bg-app-card hover:text-white"
            title="New Chat"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-app-muted transition-colors hover:bg-app-card hover:text-white md:hidden"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-app-muted">
              {group.label}
            </div>
            {group.items.map((c) => (
              <div
                key={c.id}
                className={`group relative mb-0.5 rounded-lg px-2 py-2 transition-colors ${
                  c.id === activeId
                    ? "bg-app-card text-white"
                    : "text-gray-300 hover:bg-app-card/50"
                }`}
              >
                {editingId === c.id ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => finishRename(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") finishRename(c.id)
                      if (e.key === "Escape") setEditingId(null)
                    }}
                    autoFocus
                    className="w-full bg-transparent text-sm text-white outline-none"
                  />
                ) : (
                  <button
                    onClick={() => {
                      router.push(`/chat/${c.id}`)
                      onClose?.()
                    }}
                    className="w-full text-left"
                  >
                    <span className="block truncate text-sm">{c.title}</span>
                  </button>
                )}

                <div className="absolute right-1 top-1.5 hidden group-hover:flex">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuId(menuId === c.id ? null : c.id)
                    }}
                    className="rounded p-1 text-app-muted hover:text-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>
                </div>

                {menuId === c.id && (
                  <div className="absolute right-0 top-8 z-50 w-32 rounded-lg border border-app-border bg-app-sidebar py-1 shadow-xl">
                    <button
                      onClick={() => startRename(c)}
                      className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-app-card"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        onDelete(c.id)
                        setMenuId(null)
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-app-card"
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
          <p className="px-2 py-8 text-center text-xs text-app-muted">
            No conversations yet
          </p>
        )}
      </div>

      <div className="border-t border-app-border p-3">
        <button
          onClick={() => router.push("/settings")}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-app-muted transition-colors hover:bg-app-card hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>
    </div>
  )
}
