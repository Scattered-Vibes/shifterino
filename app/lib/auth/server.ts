import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type UserRole = 'dispatcher' | 'supervisor' | 'manager'

function getClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = getClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const supabase = getClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

async function verifyEmployee(userId: string): Promise<{
  employeeId: string;
  role: UserRole;
  isNewUser: boolean;
}> {
  const supabase = getClient()
  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', userId)
    .single()

  if (error || !employee) {
    return {
      employeeId: '',
      role: 'dispatcher' as const,
      isNewUser: true
    }
  }

  return {
    employeeId: employee.id,
    role: employee.role as UserRole,
    isNewUser: false
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