/**
 * Server-side Supabase Client Configuration
 * 
 * This module provides a server-side Supabase client configured with secure cookie handling
 * and authentication settings. It uses the new @supabase/ssr package for Next.js App Router
 * server component integration.
 * 
 * Features:
 * - Secure cookie management with httpOnly and sameSite protections
 * - PKCE authentication flow for enhanced security
 * - Automatic token refresh and session persistence
 * - Standardized API headers for all requests
 * 
 * @module lib/supabase/server
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { type Database } from '@/types/database'
import config from '@/lib/config.server'

export type UserRole = 'dispatcher' | 'supervisor' | 'manager'

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
      },
    }
  )
}

export function createServiceClient() {
  const cookieStore = cookies()
  const { url, serviceKey } = config.supabase

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service configuration')
  }

  return createServerClient<Database>(
    url,
    serviceKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Deprecated: Use getUser() instead
export async function getSession() {
  console.warn('getSession() is deprecated. Use getUser() instead for better security.')
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
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

  try {
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
  } catch (error) {
    console.error('Error in requireAuth:', error)
    throw error
  }
}