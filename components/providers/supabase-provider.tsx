'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { AuthProvider } from './auth-provider'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return <AuthProvider supabaseClient={supabase}>{children}</AuthProvider>
} 