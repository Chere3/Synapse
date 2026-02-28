const FALLBACK_SUPABASE_URL = 'http://localhost:54321'
const FALLBACK_SUPABASE_ANON_KEY = 'public-anon-key'

export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY,
  }
}

export function getRequiredCerebrasApiKey() {
  const key = process.env.CEREBRAS_API_KEY
  if (!key) {
    throw new Error('CEREBRAS_API_KEY is not configured')
  }
  return key
}
