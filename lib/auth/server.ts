import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/supabase/index'
import { handleError } from '@/lib/utils/error-handler'

export interface AuthenticatedUser {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
}

export async function getUser() {
  const supabase = createClient()
  try {
    console.log('Fetching user from Supabase...')
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error fetching user:', error)
      throw error
    }
    
    if (!user) {
      console.log('No user found')
      return null
    }
    
    console.log('User found:', { id: user.id, email: user.email })
    return user
  } catch (error) {
    const appError = handleError(error as Error)
    console.error('Error in getUser:', appError)
    throw appError
  }
}

async function verifyEmployee(userId: string): Promise<{
  employeeId: string
  role: UserRole
  isNewUser: boolean
}> {
  const supabase = createClient()
  try {
    console.log('Verifying employee for user:', userId)
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, role, first_name, last_name')
      .eq('auth_id', userId)
      .single()

    if (error) {
      console.error('Error fetching employee:', error)
      throw error
    }

    if (!employee) {
      console.log('No employee record found, treating as new user')
      return {
        employeeId: '',
        role: 'dispatcher',
        isNewUser: true
      }
    }

    console.log('Employee verified:', {
      id: employee.id,
      role: employee.role,
      isNewUser: !employee.first_name || !employee.last_name
    })

    return {
      employeeId: employee.id,
      role: employee.role as UserRole,
      isNewUser: !employee.first_name || !employee.last_name
    }
  } catch (error) {
    const appError = handleError(error as Error)
    console.error('Error in verifyEmployee:', appError)
    throw appError
  }
}

export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  try {
    console.log('Checking authentication...')
    const user = await getUser()

    if (!user) {
      console.log('No user found, redirecting to login')
      redirect('/login')
    }

    console.log('Verifying employee status...')
    const { employeeId, role, isNewUser } = await verifyEmployee(user.id)

    if (isNewUser && !allowIncomplete) {
      console.log('New user detected, redirecting to profile completion')
      redirect('/complete-profile')
    }

    const authenticatedUser = {
      userId: user.id,
      employeeId,
      role,
      email: user.email || '',
      isNewUser
    }

    console.log('Authentication successful:', authenticatedUser)
    return authenticatedUser
  } catch (error) {
    const appError = handleError(error as Error)
    console.error('Error in requireAuth:', appError)
    redirect('/login')
  }
} 