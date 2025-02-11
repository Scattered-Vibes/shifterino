'use client'

import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type User } from '@supabase/supabase-js'
import { createClient } from '@/app/lib/supabase/client'
import type { Tables } from '@/app/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export type UserRole = 'dispatcher' | 'supervisor' | 'manager'

export interface AuthUser extends User {
  employee?: {
    id: string
    role: UserRole
    first_name: string | null
    last_name: string | null
  }
}

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isError: false,
  error: null
})

export function useAuth() {
  const context = useContext(AuthContext)
  const { toast } = useToast()
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      if (!session) return null

      // Fetch employee data
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, role, first_name, last_name')
        .eq('auth_id', session.user.id)
        .single()

      if (employeeError) {
        toast({
          title: 'Error fetching employee data',
          description: employeeError.message,
          variant: 'destructive',
        })
        throw employeeError
      }

      const user: AuthUser = {
        ...session.user,
        employee: employee as AuthUser['employee']
      }

      return {
        user,
        isLoading: false,
        isError: false,
        error: null
      }
    },
  })

  // If using outside of AuthProvider, return query result
  if (context === undefined) {
    return {
      user: query.data?.user ?? null,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error as Error | null,
      isAuthenticated: !!query.data?.user
    }
  }

  // If using within AuthProvider, return context
  return {
    ...context,
    isAuthenticated: !!context.user
  }
}

/**
 * Hook for checking if the current user has a specific role
 */
export function useHasRole(roleToCheck: UserRole) {
  const { user, isLoading } = useAuth()
  return {
    hasRole: !isLoading && user?.employee?.role === roleToCheck,
    isLoading
  }
}

/**
 * Hook for checking if the current user is a supervisor or manager
 */
export function useIsManager() {
  const { user, isLoading } = useAuth()
  const managerRoles: UserRole[] = ['supervisor', 'manager']
  
  const userRole = user?.employee?.role

  return {
    isManager: !isLoading && 
               userRole !== undefined && 
               managerRoles.includes(userRole),
    isLoading
  }
} 