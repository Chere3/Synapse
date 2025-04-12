'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { AuthProvider } from './auth-provider'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient<Database>()

  return <AuthProvider supabaseClient={supabase}>{children}</AuthProvider>
} 