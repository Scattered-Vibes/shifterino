import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Employee = Database['public']['Tables']['employees']['Row']
type Team = Database['public']['Tables']['teams']['Row']

export async function requireAuth() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return session.user
}

export async function requireSupervisorOrAbove() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) throw error

  if (!profile || !['supervisor', 'manager'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  return user
}

export async function requireManager() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) throw error

  if (!profile || profile.role !== 'manager') {
    throw new Error('Insufficient permissions')
  }

  return user
}

export async function verifyEmployeeAccess(user: User, employeeId: string) {
  const supabase = createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) throw error

  // Managers can access all employees
  if (profile?.role === 'manager') return true

  // Supervisors can only access their team members
  if (profile?.role === 'supervisor') {
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('supervisor_id')
      .eq('id', employeeId)
      .single()

    if (employeeError) throw employeeError

    if (employee?.supervisor_id !== user.id) {
      throw new Error('Access denied: Employee not in your team')
    }
    return true
  }

  // Regular employees can only access their own data
  if (user.id !== employeeId) {
    throw new Error('Access denied')
  }

  return true
}

export async function verifyTeamAccess(user: User, teamId: string) {
  const supabase = createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error) throw error

  // Managers can access all teams
  if (profile?.role === 'manager') return true

  // Supervisors can only access their own team
  if (profile?.role === 'supervisor') {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('supervisor_id')
      .eq('id', teamId)
      .single()

    if (teamError) throw teamError

    if (team?.supervisor_id !== user.id) {
      throw new Error('Access denied: Not your team')
    }
    return true
  }

  throw new Error('Access denied')
} 