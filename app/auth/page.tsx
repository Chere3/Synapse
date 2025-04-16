'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Domine } from 'next/font/google'

const domine = Domine({preload: true, subsets: ["latin"]})

export default function AuthPage() {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { supabaseClient, loading } = useAuth()

  useEffect(() => {
    setMounted(true)
    
    if (!loading) {
      // Set up auth state change listener
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.replace('/dashboard')
        }
      })

      // Cleanup subscription
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [router, supabaseClient, loading])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className={`mt-6 text-3xl font-extrabold text-gray-900 ${domine.className}`}>
              Welcome to Synapse
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Unleash the simplicity of legal contracts with Synapse
            </p>
          </div>
          <div className="mt-8">
            <Auth
              supabaseClient={supabaseClient}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#f97316', // orange-500
                      brandAccent: '#ea580c', // orange-600
                    },
                  },
                },
              }}
              providers={['google']}
              redirectTo={`${window.location.origin}/auth/callback`}
              theme="light"
            />
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden md:flex w-1/2 bg-orange-500 items-center justify-center">
        <div className="w-full h-full bg-[url('/images/auth-bg.jpg')] bg-cover bg-center opacity-90"></div>
      </div>
    </div>
  )
} 