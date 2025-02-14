import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase/database'

export type UserRole = Database['public']['Tables']['employees']['Row']['role']

export interface AuthenticatedUser {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
}

export async function getSessionUser() {
  const supabase = await createClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    if (!user) return null
    
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  const user = await getSessionUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, role, first_name, last_name')
    .eq('auth_id', user.id)
    .single()

  if (error) throw error

  const isNewUser = !employee || !employee.first_name || !employee.last_name
  
  if (isNewUser && !allowIncomplete) {
    redirect('/complete-profile')
  }

  return {
    userId: user.id,
    employeeId: employee?.id || '',
    role: employee?.role || 'dispatcher',
    email: user.email || '',
    isNewUser
  }
}

export async function requireRole(
  user: AuthenticatedUser, 
  roles: UserRole[]
) {
  if (!roles.includes(user.role)) {
    redirect('/unauthorized')
  }
}

export async function verifyAccess(
  user: AuthenticatedUser,
  resourceId: string,
  resourceType: 'employee' | 'team'
) {
  const supabase = await createClient()

  // Managers can access everything
  if (user.role === 'manager') return true

  if (resourceType === 'employee') {
    // Supervisors can access their team members
    if (user.role === 'supervisor') {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('supervisor_id')
        .eq('id', resourceId)
        .single()

      if (error) throw error
      if (employee.supervisor_id !== user.userId) {
        throw new Error('Access denied: Employee not in your team')
      }
      return true
    }

    // Regular employees can only access their own data
    if (user.employeeId !== resourceId) {
      throw new Error('Access denied')
    }
    return true
  }

  if (resourceType === 'team') {
    // Only supervisors can access team data
    if (user.role !== 'supervisor') {
      throw new Error('Access denied')
    }

    const { data: team, error } = await supabase
      .from('teams')
      .select('supervisor_id')
      .eq('id', resourceId)
      .single()

    if (error) throw error
    if (team.supervisor_id !== user.userId) {
      throw new Error('Access denied: Not your team')
    }
    return true
  }

  throw new Error('Invalid resource type')
} 