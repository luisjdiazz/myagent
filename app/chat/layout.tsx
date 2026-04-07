"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { useConversations } from "@/hooks/use-conversations"
import { ChatSidebar } from "@/components/chat/ChatSidebar"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, supabaseUser, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {
    conversations,
    createConversation,
    deleteConversation,
    renameConversation,
    refresh,
  } = useConversations()

  useEffect(() => {
    if (!loading && !supabaseUser) {
      router.replace("/login")
    }
  }, [supabaseUser, loading, router])

  useEffect(() => {
    refresh()
  }, [pathname, refresh])

  if (loading || !supabaseUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-accent border-t-transparent" />
      </div>
    )
  }

  const activeId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : undefined

  async function handleNewChat() {
    const lastModel =
      typeof window !== "undefined"
        ? localStorage.getItem("myagent_last_model") || "gemini-2.5-flash"
        : "gemini-2.5-flash"
    const conv = await createConversation(lastModel)
    router.push(`/chat/${conv.id}`)
    setSidebarOpen(false)
  }

  async function handleDelete(id: string) {
    await deleteConversation(id)
    if (activeId === id) {
      router.push("/chat")
    }
  }

  return (
    <div className="flex h-screen bg-app-bg">
      {/* Desktop sidebar */}
      <div className="hidden w-64 flex-shrink-0 border-r border-app-border md:block">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onNewChat={handleNewChat}
          onDelete={handleDelete}
          onRename={renameConversation}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72">
            <ChatSidebar
              conversations={conversations}
              activeId={activeId}
              onNewChat={handleNewChat}
              onDelete={handleDelete}
              onRename={renameConversation}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-app-border px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-app-muted hover:bg-app-card hover:text-white md:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-sm font-semibold text-white">MyAgent</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-app-muted">{user?.name || supabaseUser.email}</span>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-xs text-app-muted transition-colors hover:bg-app-card hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
