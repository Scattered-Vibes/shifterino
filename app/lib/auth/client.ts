'use client'

import { createClient } from '@/lib/supabase/client'
import { type Database } from '@/types/supabase/database'

export type UserRole = Database['public']['Enums']['employee_role']

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

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function verifyEmployee(userId: string): Promise<{
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
    role: employee.role,
    isNewUser: !employee.first_name || !employee.last_name
  }
}