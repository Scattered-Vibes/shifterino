'use client';

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import type { Employee } from '@/types'

type SupabaseContext = {
  supabase: SupabaseClient
  session: Session | null
  employee: Employee | null
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
  const router = useRouter()

  const fetchEmployee = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (error) throw error
      // Cast the data to Employee type since we know the shape matches
      setEmployee(data as Employee)
      return data
    } catch (error) {
      console.error('Error fetching employee:', error)
      return null
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchEmployee(session.user.id)
    }
  }, [session])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession) => {
      setSession(currentSession)

      if (event === 'SIGNED_IN') {
        if (currentSession?.user) {
          const employee = await fetchEmployee(currentSession.user.id)
          if (!employee) {
            router.push('/complete-profile')
          } else {
            router.push('/overview')
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setEmployee(null)
        router.push('/login')
      }

      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const value = {
    supabase,
    session,
    employee,
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