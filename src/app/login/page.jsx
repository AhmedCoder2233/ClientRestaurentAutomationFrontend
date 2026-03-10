'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { login } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('auth_token')) router.push('/dashboard')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login(username, password)
      localStorage.setItem('auth_token', res.data.token)
      toast.success(`Welcome, ${res.data.username}!`)
      router.push('/dashboard')
    } catch {
      toast.error('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-2xl shadow-red-500/30">
              <ChefHat size={30} className="text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-transparent" />
            {/* Glow ring */}
            <div className="absolute -inset-1 rounded-2xl bg-red-500/20 blur-md -z-10" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RestaurantOS</h1>
          <p className="text-gray-500 text-sm mt-1.5">Management Suite</p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl shadow-black/50 backdrop-blur-sm">

          {/* Card top accent */}
          <div className="h-0.5 w-full bg-gradient-to-r from-red-500 via-yellow-400 to-transparent rounded-full mb-6 -mt-1 opacity-60" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</label>
              <input
                className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all"
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-neutral-700"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 mt-2"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" />Signing in…</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Bottom hint */}
          <p className="text-center text-xs text-gray-600 mt-4">RestaurantOS · Admin Portal</p>
        </div>
      </div>
    </div>
  )
}