 // Start of Selection
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Employee = Database['public']['Tables']['employees']['Row']

/**
 * AuthContextType defines the structure for authentication context. It includes user and employee data,
 * loading state, error handling, and authentication actions (signIn and signOut).
 */
interface AuthContextType {
  user: User | null
  employee: Employee | null
  isLoading: boolean
  error: Error | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

/**
 * AuthContext provides a React context to share authentication state and actions across the application.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider component wraps its children with the authentication context.
 * It uses the useAuth hook to supply authentication state and renders a loading spinner if auth is loading.
 *
 * @param {Object} props - The component properties.
 * @param {ReactNode} props.children - Child components that require access to the authentication context.
 * @returns {JSX.Element} The provider component wrapping the application.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {auth.isLoading ? (
        <div className="flex h-screen w-screen items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

/**
 * useAuthContext is a custom hook that allows components to access the authentication context.
 *
 * @returns {AuthContextType} The current authentication context.
 * @throws {Error} Throws an error if the hook is used outside an AuthProvider.
 */
export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}