import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

type Role = 'admin' | 'teacher' | 'parent' | 'student' | null

interface AuthContextType {
  user: User | null
  session: Session | null
  role: Role
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
})

const roleCache: Record<string, Role> = {}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  const fetchRole = async (userId: string) => {
    if (roleCache[userId]) {
      setRole(roleCache[userId])
      return
    }
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()
      const r = (data?.role as Role) ?? null
      roleCache[userId] = r
      setRole(r)
    } catch {
      setRole(null)
    }
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchRole(session.user.id)
      }
      if (mounted) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'INITIAL_SESSION') return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchRole(session.user.id)
        } else {
          setRole(null)
        }
        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const userId = user?.id
    if (userId) delete roleCache[userId]
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
