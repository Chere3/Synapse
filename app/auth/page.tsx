'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'

export default function AuthPage() {
  const [error] = useState<string | null>(null)
  const router = useRouter()
  const { supabaseClient, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.replace('/dashboard')
        }
      })
      return () => { subscription.unsubscribe() }
    }
  }, [router, supabaseClient, loading])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-md-background">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-md-outline-variant"
          style={{ borderTopColor: 'var(--md-sys-color-primary)' }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-md-background">
        <div className="md-card-elevated max-w-md w-full p-8 text-center">
          <p className="text-md-error text-body-md">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-md-background">
      {/* Left — Auth form */}
      <div className="flex w-full flex-col items-center justify-center px-8 py-16 md:w-1/2">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="mb-10">
            <span
              className="text-headline-sm font-bold text-md-primary"
              style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
            >
              Synapse
            </span>
            <h1 className="mt-3 text-title-lg text-md-on-surface">
              Welcome back
            </h1>
            <p className="mt-1 text-body-md text-md-on-surface-variant">
              Sign in to access your legal document analysis
            </p>
          </div>

          <Auth
            supabaseClient={supabaseClient}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand:       'var(--md-sys-color-primary)',
                    brandAccent: '#a34500',
                    inputBorder:         'var(--md-sys-color-outline)',
                    inputBorderFocus:    'var(--md-sys-color-primary)',
                    inputBorderHover:    'var(--md-sys-color-on-surface)',
                    inputBackground:     'transparent',
                    inputText:           'var(--md-sys-color-on-surface)',
                    inputPlaceholder:    'var(--md-sys-color-on-surface-variant)',
                    defaultButtonBackground: 'var(--md-sys-color-surface-variant)',
                    defaultButtonText:   'var(--md-sys-color-on-surface-variant)',
                    anchorTextColor:     'var(--md-sys-color-primary)',
                  },
                  radii: {
                    borderRadiusButton: 'var(--md-sys-shape-full)',
                    buttonBorderRadius: 'var(--md-sys-shape-full)',
                    inputBorderRadius:  'var(--md-sys-shape-extra-small)',
                  },
                  fonts: {
                    bodyFontFamily:   'var(--font-dm-sans, DM Sans, system-ui, sans-serif)',
                    buttonFontFamily: 'var(--font-dm-sans, DM Sans, system-ui, sans-serif)',
                    labelFontFamily:  'var(--font-dm-sans, DM Sans, system-ui, sans-serif)',
                    inputFontFamily:  'var(--font-dm-sans, DM Sans, system-ui, sans-serif)',
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

      {/* Right — Brand panel */}
      <div
        className="hidden md:flex w-1/2 flex-col items-start justify-end p-16"
        style={{ background: 'linear-gradient(135deg, var(--md-sys-color-primary-container) 0%, color-mix(in srgb, var(--md-sys-color-primary) 20%, var(--md-sys-color-surface)) 100%)' }}
      >
        <blockquote className="mb-6">
          <p
            className="text-headline-md leading-snug text-md-on-primary-container"
            style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
          >
            &ldquo;Contracts are the foundation of trust. Synapse helps you read them clearly.&rdquo;
          </p>
        </blockquote>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {[
            { n: '2,400+', label: 'legal professionals' },
            { n: '18,000+', label: 'documents analyzed' },
            { n: '< 5s', label: 'average analysis time' },
          ].map(({ n, label }) => (
            <div key={label} className="flex items-baseline gap-3">
              <span
                className="text-headline-sm font-bold text-md-primary"
                style={{ fontFamily: 'var(--font-domine, Domine, serif)' }}
              >
                {n}
              </span>
              <span className="text-body-md text-md-on-surface-variant">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
