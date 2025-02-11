import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type AuthResult = {
  userId: string
  role: 'dispatcher' | 'supervisor' | 'manager'
  employeeId: string
  teamId?: string
}

/**
 * Require authentication and return user info
 * Throws error if user is not authenticated
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Get employee info
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, role, team_id')
    .eq('auth_id', user.id)
    .single()

  if (employeeError || !employee) {
    throw new Error('Employee record not found')
  }

  return {
    userId: user.id,
    role: employee.role,
    employeeId: employee.id,
    teamId: employee.team_id
  }
}

/**
 * Require manager role
 * Returns auth result if user is a manager, throws error otherwise
 */
export async function requireManager(): Promise<AuthResult> {
  const auth = await requireAuth()
  if (auth.role !== 'manager') {
    throw new Error('Manager role required')
  }
  return auth
}

/**
 * Require supervisor or above
 * Returns auth result if user is a supervisor or manager, throws error otherwise
 */
export async function requireSupervisorOrAbove(): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!['supervisor', 'manager'].includes(auth.role)) {
    throw new Error('Supervisor role required')
  }
  return auth
}

/**
 * Handle authorization errors consistently
 */
export function handleAuthError(error: unknown) {
  console.error('Auth error:', error)
  
  if (error instanceof Error) {
    switch (error.message) {
      case 'Unauthorized':
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      case 'Manager role required':
      case 'Supervisor role required':
        return NextResponse.json({ error: error.message }, { status: 403 })
      case 'Employee record not found':
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      default:
        return NextResponse.json(
          { error: 'Internal server error' }, 
          { status: 500 }
        )
    }
  }

  return NextResponse.json(
    { error: 'Internal server error' }, 
    { status: 500 }
  )
}

/**
 * Verify team access
 * Throws error if user doesn't have access to the specified team
 */
export async function verifyTeamAccess(
  auth: AuthResult,
  teamId: string
): Promise<void> {
  if (auth.role === 'manager') return // Managers have access to all teams
  
  if (auth.teamId !== teamId) {
    throw new Error('Team access denied')
  }
}

/**
 * Verify employee access
 * Throws error if user doesn't have access to the specified employee
 */
export async function verifyEmployeeAccess(
  auth: AuthResult,
  employeeId: string
): Promise<void> {
  if (auth.role === 'manager') return // Managers have access to all employees
  
  const supabase = createClient()
  
  // Get employee's team
  const { data: employee, error } = await supabase
    .from('employees')
    .select('team_id')
    .eq('id', employeeId)
    .single()
    
  if (error || !employee) {
    throw new Error('Employee not found')
  }
  
  // Verify team access
  if (auth.teamId !== employee.team_id) {
    throw new Error('Employee access denied')
  }
} 