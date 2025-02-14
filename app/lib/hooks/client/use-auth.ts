'use client'

import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { useSupabase } from '@/app/providers/providers'
import type { Employee } from '@/types'

export function useAuth() {
  const { supabase } = useSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const fetchEmployee = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (error) throw error
      return data as Employee
    } catch (error) {
      console.error('Error fetching employee:', error)
      return null
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setEmployee(null)
          setIsLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          const employeeData = await fetchEmployee(session.user.id)
          if (mounted) {
            setEmployee(employeeData)
            setIsLoading(false)
          }
        } else {
          setIsLoading(false)
        }
      }
    )

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      
      if (session?.user) {
        setUser(session.user)
        const employeeData = await fetchEmployee(session.user.id)
        if (mounted) {
          setEmployee(employeeData)
        }
      }
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchEmployee])

  const signOut = async () => {
    try {
      setIsSigningOut(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setIsSigningOut(false)
    }
  }

  return {
    user,
    employee,
    isLoading,
    isSigningOut,
    signOut,
  }
} 