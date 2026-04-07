"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  email: string
  name: string
  hasApiKey: boolean
}

interface AuthContextType {
  user: UserProfile | null
  supabaseUser: User | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/trpc/user.me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        const data = await res.json()
        const profile = data?.result?.data
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            hasApiKey: profile.hasApiKey,
          })
        }
      }
    } catch {
      // Profile fetch failed — user may not exist yet
    }
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setSupabaseUser(session.user)
        await fetchProfile()
      }
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setSupabaseUser(session.user)
          await fetchProfile()
        } else {
          setSupabaseUser(null)
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSupabaseUser(null)
    router.push("/login")
  }, [supabase, router])

  const refreshUser = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
