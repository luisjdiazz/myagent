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
      <div className="flex h-[100dvh] items-center justify-center bg-[#09090b]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
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
    <div className="flex h-[100dvh] bg-[#09090b]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] flex-shrink-0 border-r border-white/[0.04] md:flex md:flex-col">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onNewChat={handleNewChat}
          onDelete={handleDelete}
          onRename={renameConversation}
          userEmail={supabaseUser.email}
        />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] animate-slide-in">
            <ChatSidebar
              conversations={conversations}
              activeId={activeId}
              onNewChat={handleNewChat}
              onDelete={handleDelete}
              onRename={renameConversation}
              onClose={() => setSidebarOpen(false)}
              userEmail={supabaseUser.email}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-11 items-center justify-between border-b border-white/[0.04] px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-zinc-600 transition-colors hover:text-zinc-400 md:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-[13px] font-medium text-zinc-300">MyAgent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[12px] text-zinc-600 sm:block">
              {user?.name || supabaseUser.email}
            </span>
            <button
              onClick={logout}
              className="rounded-full p-2 text-zinc-600 transition-colors hover:text-zinc-400"
              title="Sign out"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3h-9m9 0l-3-3m3 3l-3 3" />
              </svg>
            </button>
          </div>
        </header>

        {children}
      </main>
    </div>
  )
}
