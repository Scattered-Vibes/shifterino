import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface AuthenticatedUser {
  id: string
  employeeId: string
  role: 'dispatcher' | 'supervisor' | 'manager'
}

/**
 * Verifies that a user is authenticated and exists in both auth.users and employees tables
 * Redirects to login if authentication is invalid
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const supabase = createClient()

  try {
    // Check if user is authenticated and get metadata
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.id) {
      redirect('/login')
    }

    const userRole = user.user_metadata?.role
    if (!userRole || !['dispatcher', 'supervisor', 'manager'].includes(userRole)) {
      console.error('User has invalid or missing role in metadata')
      await supabase.auth.signOut()
      redirect('/login')
    }

    // Check if user has a valid employee record
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, role')
      .eq('auth_id', user.id)
      .single()

    if (employeeError || !employee?.id) {
      console.error('User not found in employees table:', employeeError)
      await supabase.auth.signOut()
      redirect('/login')
    }

    // Verify role consistency
    if (employee.role !== userRole) {
      console.error('Role mismatch between auth metadata and employees')
      await supabase.auth.signOut()
      redirect('/login')
    }

    return {
      id: user.id,
      employeeId: employee.id,
      role: employee.role as 'dispatcher' | 'supervisor' | 'manager'
    }
  } catch (error) {
    console.error('Error in requireAuth:', error)
    redirect('/login')
  }
} 