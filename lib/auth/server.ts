import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase/database'

type UserRole = Database['public']['Enums']['employee_role']

export interface AuthenticatedUser {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
}

export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

async function verifyEmployee(userId: string): Promise<{
  employeeId: string
  role: UserRole
  isNewUser: boolean
}> {
  const supabase = createClient()
  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, role, first_name, last_name')
    .eq('auth_id', userId)
    .single()

  if (error || !employee) {
    return {
      employeeId: '',
      role: 'dispatcher',
      isNewUser: true
    }
  }

  return {
    employeeId: employee.id,
    role: employee.role as UserRole,
    isNewUser: !employee.first_name || !employee.last_name
  }
}

export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const { employeeId, role, isNewUser } = await verifyEmployee(user.id)

  if (isNewUser && !allowIncomplete) {
    redirect('/complete-profile')
  }

  return {
    userId: user.id,
    employeeId,
    role,
    email: user.email || '',
    isNewUser
  }
} 