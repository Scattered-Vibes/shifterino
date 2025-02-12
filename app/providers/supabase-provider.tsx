'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@/lib/supabase/client'
import type { Session, Subscription } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import type { Employee } from '@/types'
import { Loader2 } from 'lucide-react'

type SupabaseContext = {
  supabase: SupabaseClient
  session: Session | null
  employee: Employee | null
  isLoading: boolean
  isInitialized: boolean
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
  session: initialSession,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  const [supabase] = useState(() => createClient())
  const [session, setSession] = useState<Session | null>(initialSession)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const isNavigatingRef = useRef(false)
  const initTimeoutRef = useRef<NodeJS.Timeout>()
  const router = useRouter()
  const pathname = usePathname()

  const fetchEmployee = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (error) throw error
      setEmployee(data as Employee)
      return data
    } catch (error) {
      console.error('Error fetching employee:', error)
      return null
    }
  }, [supabase])

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        
        setSession(user ? { user, expires_at: 0 } as Session : null)
        if (user) {
          await fetchEmployee(user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    // Set a timeout to prevent infinite loading
    initTimeoutRef.current = setTimeout(() => {
      setIsInitialized(true)
    }, 5000)

    initAuth()

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
    }
  }, [supabase, fetchEmployee])

  useEffect(() => {
    let mounted = true
    let authSubscription: Subscription | null = null

    async function handleAuthChange(event: AuthChangeEvent, currentSession: Session | null) {
      if (!mounted) return

      console.log('Auth state change:', event, currentSession?.user?.id)
      
      if (isNavigatingRef.current) {
        console.log('Navigation already in progress, skipping...')
        return
      }

      setIsLoading(true)
      setSession(currentSession)

      try {
        if (event === 'SIGNED_IN') {
          if (currentSession?.user) {
            isNavigatingRef.current = true
            const employeeData = await fetchEmployee(currentSession.user.id)
            
            if (!employeeData && pathname !== '/complete-profile') {
              await router.push('/complete-profile')
            } else if (pathname === '/login' || pathname === '/signup') {
              await router.push('/overview')
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setEmployee(null)
          isNavigatingRef.current = true
          if (pathname !== '/login') {
            await router.push('/login')
          }
        }
      } catch (error) {
        console.error('Navigation error:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
          isNavigatingRef.current = false
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)
    authSubscription = subscription

    return () => {
      mounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [supabase, router, pathname, fetchEmployee])

  const value = {
    supabase,
    session,
    employee,
    isLoading,
    isInitialized
  }

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  )
}

export function useSupabase() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
} 