import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      await handleAuthError()
    }

    if (!session?.access_token) {
      console.error('No valid session found')
      await handleAuthError()
    }

    // At this point we know session is not null and has an access_token
    const validSession = session!

    // Validate session in database
    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_session', { session_id: validSession.access_token })

    if (validationError || !isValid) {
      console.error('Session validation failed:', validationError)
      await handleAuthError()
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User error:', userError)
      await handleAuthError()
    }

    // Type assertion is safe here because we've checked for null above
    const authenticatedUser = user as User

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