import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase/database'

export type AuthenticatedUser = {
  userId: string
  employeeId: string
  role: Database['public']['Tables']['employees']['Row']['role']
  email: string
  isNewUser: boolean
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = createClient()

  // Get user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) redirect('/login')

  // Get employee details
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()

  if (employeeError) throw employeeError
  if (!employee) redirect('/unauthorized')

  return {
    userId: user.id,
    employeeId: employee.id,
    role: employee.role,
    email: user.email!,
    isNewUser: false // Default to false since we don't track this yet
  }
}

export function requireRole(user: AuthenticatedUser, roles: Database['public']['Tables']['employees']['Row']['role'][]) {
  if (!roles.includes(user.role)) {
    redirect('/unauthorized')
  }
} 