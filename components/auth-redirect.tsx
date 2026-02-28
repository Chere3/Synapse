'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Invisible client component — only job is to redirect authenticated
 * users to /dashboard. Keeps the landing page itself a Server Component.
 */
export function AuthRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.push('/dashboard')
  }, [user, loading, router])

  return null
}
