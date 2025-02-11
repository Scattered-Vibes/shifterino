import { createClient } from '@/lib/supabase/client'
import { type UserRole } from './auth/server'

export type AuthenticatedUser = {
  userId: string
  employeeId: string
  role: UserRole
  email: string
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()

  if (employeeError || !employee) {
    return null
  }

  return {
    userId: user.id,
    employeeId: employee.id,
    role: employee.role as UserRole,
    email: user.email || ''
  }
} 