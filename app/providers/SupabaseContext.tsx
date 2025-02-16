'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { SupabaseClient, Session, User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { createClient } from '@/lib/supabase/client'

type DbEmployee = Database['public']['Tables']['employees']['Row']

type SupabaseContextType = {
  supabase: SupabaseClient<Database>
  user: User | null
  session: Session | null
  employee: DbEmployee | null
  isLoading: boolean
  error: Error | null
}

export const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

interface SupabaseProviderProps {
  children: React.ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [supabase] = useState(() => createClient())
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<DbEmployee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch employee data
  const fetchEmployeeData = async (userId: string) => {
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (employeeError) {
        throw employeeError
      }

      if (employeeData) {
        setEmployee(employeeData)
      } else {
        setError(new Error('No employee record found'))
      }
    } catch (err) {
      console.error('Error fetching employee data:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch employee data'))
      setEmployee(null)
    }
  }

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      
      if (initialSession?.user) {
        fetchEmployeeData(initialSession.user.id)
      }
      
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Supabase auth event: ${event}`, session)
      
      // Reset error state on auth change
      setError(null)
      
      // Update session and user state
      setSession(session)
      setUser(session?.user ?? null)

      // Handle employee data
      if (session?.user) {
        setIsLoading(true)
        await fetchEmployeeData(session.user.id)
        setIsLoading(false)
      } else {
        setEmployee(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <SupabaseContext.Provider 
      value={{ 
        supabase, 
        user, 
        session, 
        employee, 
        isLoading,
        error
      }}
    >
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 