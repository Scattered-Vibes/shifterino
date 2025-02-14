'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthenticatedUser, UserRole } from './core'

export type { AuthenticatedUser, UserRole }

/**
 * Get the current user from the client-side Supabase instance
 * This is useful for components that need to check auth state
 */
export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Hook to subscribe to auth state changes
 * This is useful for components that need to react to auth changes
 */
export function useAuthListener(
  onSignIn?: (user: AuthenticatedUser) => void,
  onSignOut?: () => void
) {
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && onSignIn) {
        // Get employee details
        const { data: employee } = await supabase
          .from('employees')
          .select('id, role, first_name, last_name')
          .eq('auth_id', session.user.id)
          .single()

        // Convert Supabase user to our AuthenticatedUser type
        const user: AuthenticatedUser = {
          userId: session.user.id,
          employeeId: employee?.id || '',
          role: employee?.role || 'dispatcher',
          email: session.user.email || '',
          isNewUser: !employee || !employee.first_name || !employee.last_name
        }
        onSignIn(user)
      } else if (event === 'SIGNED_OUT' && onSignOut) {
        onSignOut()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [onSignIn, onSignOut, supabase.auth])
} 