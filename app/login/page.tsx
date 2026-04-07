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
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0f0f0f] px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">MyAgent</h1>
          <p className="mt-1.5 text-sm text-gray-500">Multi-model AI chat</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          {/* Tab switcher */}
          <div className="mb-6 flex gap-1 rounded-lg bg-white/5 p-1">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError("") }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                !isRegister
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError("") }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                isRegister
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegister}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-colors focus:border-indigo-500/50 focus:outline-none"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-colors focus:border-indigo-500/50 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-colors focus:border-indigo-500/50 focus:outline-none"
                placeholder="Minimum 6 characters"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-50"
            >
              {loading ? "Loading..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
