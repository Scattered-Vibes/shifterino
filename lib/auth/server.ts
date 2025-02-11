import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { type Database } from '@/types/supabase/database'

export type UserRole = 'dispatcher' | 'supervisor' | 'manager' | 'admin'

export interface AuthenticatedUser {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
}

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This can happen in middleware or other contexts
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

export async function getSession() {
  const supabase = createClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function getUser() {
  const session = await getSession()
  return session?.user ?? null
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
    email: user.email ?? '',
    isNewUser
  }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}