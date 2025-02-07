import { redirect } from 'next/navigation'

import { requireAuth, type AuthenticatedUser } from '@/lib/supabase/auth'

export type { AuthenticatedUser }

/**
 * Verifies that a user is authenticated and exists in both auth.users and employees tables
 * Redirects to login if authentication is invalid
 */
export async function requireAuthOrRedirect(): Promise<AuthenticatedUser> {
  try {
    return await requireAuth()
  } catch (error) {
    console.error('Error in requireAuth:', error)
    redirect('/login')
  }
}
