import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'dispatcher' | 'supervisor' | 'manager'

export interface AuthenticatedUser {
  userId: string
  employeeId: string | null
  role: UserRole
  email: string
  isNewUser: boolean
}

export async function requireAuth(allowIncomplete = false): Promise<AuthenticatedUser> {
  const supabase = createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      await handleAuthError()
    }

    // At this point we know user is not null due to the check above
    const authenticatedUser = user!

    // Validate user in database
    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_session', { session_token: authenticatedUser.id })

    if (validationError || !isValid) {
      console.error('User validation failed:', validationError)
      await handleAuthError()
    }

    const role = authenticatedUser.user_metadata?.role as UserRole
    if (!role || !['dispatcher', 'supervisor', 'manager'].includes(role)) {
      console.error('Invalid or missing role in user metadata:', authenticatedUser.user_metadata)
      await handleAuthError()
    }

    const { data: employee } = await supabase
      .from('employees')
      .select('id, auth_id, role')
      .eq('auth_id', authenticatedUser.id)
      .single()

    const isNewUser = !employee || 
      !authenticatedUser.user_metadata?.first_name || 
      !authenticatedUser.user_metadata?.last_name

    if (isNewUser && !allowIncomplete) {
      redirect('/complete-profile')
    }

    return {
      userId: authenticatedUser.id,
      employeeId: employee?.id || null,
      role: role,
      email: authenticatedUser.email || '',
      isNewUser
    }
  } catch (error) {
    console.error('Error in requireAuth:', error)
    await handleAuthError()
    throw error // This line will never be reached due to redirect
  }
}

async function handleAuthError(): Promise<never> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
} 