'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Session } from '@supabase/supabase-js'

export default function AuthPage() {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { supabaseClient, loading } = useAuth()

  useEffect(() => {
    setMounted(true)
    
    if (!loading) {
      // Check if we have a session
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.push('/')
        }
      })
    }
  }, [router, supabaseClient, loading])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Synapse Legal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to analyze your legal documents
          </p>
        </div>
        <div className="mt-8">
          <Auth
            supabaseClient={supabaseClient}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            redirectTo={`${window.location.origin}/auth/callback`}
            theme="light"
          />
        </div>
      </div>
    </div>
  )
} 