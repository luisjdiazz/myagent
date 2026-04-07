"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"

export default function Home() {
  const { supabaseUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      router.replace(supabaseUser ? "/chat" : "/login")
    }
  }, [supabaseUser, loading, router])

  return (
    <div className="flex h-screen items-center justify-center bg-app-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-accent border-t-transparent" />
    </div>
  )
}
