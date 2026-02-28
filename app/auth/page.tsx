'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Domine } from 'next/font/google'

const domine = Domine({preload: true, subsets: ["latin"]})

export default function AuthPage() {
  const [error] = useState<string | null>(null)
  const router = useRouter()
  const { supabaseClient, loading } = useAuth()

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Form */}
      <div className="flex w-full items-center justify-center p-8 md:w-1/2">
        <div className="w-full max-w-md space-y-8">
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
              redirectTo={`${globalThis.location.origin}/auth/callback`}
              theme="light"
            />
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden w-1/2 items-center justify-center bg-orange-500 md:flex">
        <div className="h-full w-full bg-[url('/images/auth-bg.jpg')] bg-cover bg-center opacity-90"></div>
      </div>
    </div>
  )
} 