'use client'

import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { useRouter } from 'next/navigation'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import type { Employee } from '@/types'
import Cookies from 'js-cookie'

type SupabaseContextType = {
  supabase: ReturnType<typeof createBrowserClient<Database>>
  user: User | null
  employee: Employee | null
  isLoading: boolean
  isSigningOut: boolean
  signOut: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [supabase] = useState(() =>
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const fetchEmployee = useCallback(async (userId: string) => {
    console.log(`[useAuth] fetchEmployee called for userId: ${userId}`)
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (error) throw error
      console.log('[useAuth] Employee data fetched:', data)
      return data as Employee

    } catch (error) {
      console.error('[useAuth] Error fetching employee:', error)
      return null
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true
    console.log('Provider - Effect running')

    const handleAuthChange = async (event: AuthChangeEvent, session: Session | null) => {
      console.log('Provider - Auth state changed:', event, session?.user?.email)

      if (!mounted) {
        console.log('Provider - Component unmounted, skipping auth change.')
        return
      }

      if (event === 'SIGNED_IN') {
        setIsLoading(true)
      }

      if (event === 'SIGNED_OUT') {
        console.log("Signed out")
        Cookies.remove('sb-access-token')
        Cookies.remove('sb-refresh-token')
        setUser(null)
        setEmployee(null)
        router.push('/login')
      } else if (session?.user) {
        console.log("Signed in or token refreshed")
        setUser(session.user)
        if (!employee || employee.auth_id !== session.user.id) {
          const employeeData = await fetchEmployee(session.user.id)
          if (mounted) {
            setEmployee(employeeData)
            setIsLoading(false)
          }
        } else {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return

      if (session?.user) {
        console.log("Initial session found:", session.user.email)
        setUser(session.user)
        fetchEmployee(session.user.id).then(employeeData => {
          if (mounted) {
            setEmployee(employeeData)
            setIsLoading(false)
          }
        })
      } else {
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      console.log('Provider - Cleanup: unsubscribing and marking unmounted')
    }
  }, [supabase, router, fetchEmployee, employee?.auth_id])

  const signOut = useCallback(async () => {
    setIsSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear auth cookies
      Cookies.remove('sb-access-token')
      Cookies.remove('sb-refresh-token')
      
      setUser(null)
      setEmployee(null)
      router.refresh()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setIsSigningOut(false)
    }
  }, [supabase, router])

  const value = useMemo(() => ({
    supabase,
    user,
    employee,
    isLoading,
    isSigningOut,
    signOut
  }), [supabase, user, employee, isLoading, isSigningOut, signOut])

  return (
    <SupabaseContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 