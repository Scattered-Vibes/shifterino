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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Supabase auth event: ${event}`, session)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: employeeData, error } = await supabase
          .from('employees')
          .select('*')
          .eq('auth_id', session.user.id)
          .single()
          
        if (error) {
          console.error('Error fetching employee data:', error)
        }
        
        if (employeeData) {
          setEmployee(employeeData)
        }
      } else {
        setEmployee(null)
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <SupabaseContext.Provider value={{ supabase, user, session, employee, isLoading }}>
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