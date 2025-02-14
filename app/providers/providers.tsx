'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './theme-provider'
import { createBrowserClient } from '@supabase/ssr'
import { Toaster } from '@/components/ui/toaster'
import type { Session } from '@supabase/supabase-js'
import { useState, createContext, useContext, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Database } from '@/types/supabase'
import type { Employee } from '@/types'

interface SupabaseContextType {
  supabase: ReturnType<typeof createBrowserClient<Database>>
  session: Session | null
  employee: Employee | null
  isLoading: boolean
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider')
  }
  return context
}

interface ProvidersProps {
  children: React.ReactNode
  initialSession: Session | null
}

export function Providers({ children, initialSession }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [supabase] = useState(() => 
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  const [session, setSession] = useState<Session | null>(initialSession)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Fetch employee data
  const fetchEmployee = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (error) throw error
      setEmployee(data)
      return data
    } catch (error) {
      console.error('Error fetching employee:', error)
      return null
    }
  }

  // Handle auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state change:', event, currentSession?.user?.email)
      setSession(currentSession)
      setIsLoading(true)

      try {
        if (event === 'SIGNED_IN') {
          if (currentSession?.user) {
            const employeeData = await fetchEmployee(currentSession.user.id)
            if (!employeeData && pathname !== '/complete-profile') {
              router.push('/complete-profile')
            } else if (pathname === '/login' || pathname === '/signup') {
              router.push('/overview')
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setEmployee(null)
          if (pathname !== '/login') {
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('Error handling auth change:', error)
      } finally {
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname])

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseContext.Provider value={{ supabase, session, employee, isLoading }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </SupabaseContext.Provider>
    </QueryClientProvider>
  )
} 