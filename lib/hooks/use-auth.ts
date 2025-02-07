'use client'

import { createContext, useContext } from 'react'
import { type User } from '@supabase/supabase-js'

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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
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