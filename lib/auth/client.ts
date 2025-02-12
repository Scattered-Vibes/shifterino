'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase/database'

export type UserRole = Database['public']['Enums']['employee_role']

export interface AuthenticatedUser {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
}

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && onSignIn) {
        // Convert Supabase user to our AuthenticatedUser type
        const user: AuthenticatedUser = {
          userId: session.user.id,
          employeeId: session.user.user_metadata.employee_id || '',
          role: session.user.user_metadata.role as UserRole,
          email: session.user.email || '',
          isNewUser: !session.user.user_metadata.employee_id
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