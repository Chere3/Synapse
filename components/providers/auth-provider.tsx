'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

type AuthContextType = {
  supabaseClient: SupabaseClient<Database>
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  supabaseClient,
  children,
}: {
  supabaseClient: SupabaseClient<Database>
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabaseClient])

  return (
    <AuthContext.Provider value={{ supabaseClient, user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 