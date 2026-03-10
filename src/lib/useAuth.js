'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verifyToken } from '@/lib/api'

export function useAuth() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) { router.push('/login'); return }
    verifyToken(token)
      .catch(() => { localStorage.removeItem('auth_token'); router.push('/login') })
      .finally(() => setLoading(false))
  }, [])

  return { loading }
}