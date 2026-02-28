import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv } from '@/utils/env'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { url, anonKey } = getSupabasePublicEnv()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        supabaseResponse.cookies.set(name, value, options)
      },
      remove(name: string, options: any) {
        supabaseResponse.cookies.set(name, '', options)
      },
    },
  })

  await supabase.auth.getUser()
  return supabaseResponse
}
