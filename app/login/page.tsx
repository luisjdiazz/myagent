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
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-[#09090b] px-4">
      {/* Subtle gradient glow behind card */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(129,140,248,0.06),transparent_70%)]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-medium tracking-tight text-white">MyAgent</h1>
          <p className="mt-1.5 text-[13px] text-zinc-600">Multi-model AI chat</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
          {/* Tab switcher */}
          <div className="mb-6 flex gap-1 rounded-lg bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError("") }}
              className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-all duration-200 ${
                !isRegister
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError("") }}
              className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-all duration-200 ${
                isRegister
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-zinc-500">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegister}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-zinc-100 placeholder-zinc-600 transition-all duration-200 focus:border-indigo-400/30 focus:outline-none"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-zinc-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-zinc-100 placeholder-zinc-600 transition-all duration-200 focus:border-indigo-400/30 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-zinc-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-zinc-100 placeholder-zinc-600 transition-all duration-200 focus:border-indigo-400/30 focus:outline-none"
                placeholder="Minimum 6 characters"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/[0.06] bg-red-400/[0.04] px-3.5 py-2.5 text-[13px] text-red-400/80">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-400 py-2.5 text-[14px] font-medium text-white transition-all duration-200 hover:bg-indigo-300 disabled:opacity-50"
            >
              {loading ? "Loading..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
