import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { getSupabasePublicEnv } from '@/utils/env'

export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv()
  return createBrowserClient<Database>(url, anonKey)
}
