'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { AuthProvider } from './auth-provider'
import { getSupabasePublicEnv } from '@/utils/env'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { url, anonKey } = getSupabasePublicEnv()
  const supabase = createBrowserClient<Database>(url, anonKey)

  return <AuthProvider supabaseClient={supabase}>{children}</AuthProvider>
}
