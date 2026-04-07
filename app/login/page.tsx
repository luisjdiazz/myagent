"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (signUpError) throw signUpError
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }
      router.push("/chat")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">MyAgent</h1>
          <p className="mt-2 text-app-muted">Your multi-model AI chat platform</p>
        </div>

        <div className="rounded-xl border border-app-border bg-app-card p-6">
          <div className="mb-6 flex rounded-lg bg-app-bg p-1">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError("") }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                !isRegister ? "bg-app-accent text-white" : "text-app-muted hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError("") }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                isRegister ? "bg-app-accent text-white" : "text-app-muted hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="mb-1 block text-sm text-app-muted">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegister}
                  className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-2.5 text-white placeholder-app-muted/50 focus:border-app-accent focus:outline-none"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-app-muted">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-2.5 text-white placeholder-app-muted/50 focus:border-app-accent focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-app-muted">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-2.5 text-white placeholder-app-muted/50 focus:border-app-accent focus:outline-none"
                placeholder="Minimum 6 characters"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-app-accent py-2.5 font-medium text-white transition-colors hover:bg-app-accent-hover disabled:opacity-50"
            >
              {loading ? "Loading..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
