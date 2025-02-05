import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, getAuthenticatedUser, getEmployeeData } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Type representing an employee record from the database.
 *
 * @typedef {Database['public']['Tables']['employees']['Row']} Employee
 */
type Employee = Database['public']['Tables']['employees']['Row']

/**
 * Interface for the authentication state managed by the useAuth hook.
 *
 * @interface AuthState
 * @property {User | null} user - The authenticated user; null if not authenticated.
 * @property {Employee | null} employee - The employee details associated with the authenticated user.
 * @property {boolean} isLoading - Indicates whether an authentication operation is in progress.
 * @property {Error | null} error - Any error encountered during authentication operations.
 */
interface AuthState {
  user: User | null
  employee: Employee | null
  isLoading: boolean
  error: Error | null
}

/**
 * Custom hook for managing authentication state and actions.
 *
 * This hook checks the current authentication status, subscribes to auth state changes,
 * and provides functions for signing in and signing out. It also retrieves associated
 * employee data upon successful authentication.
 *
 * @returns {object} An object containing:
 *  - {User | null} user: The currently authenticated user.
 *  - {Employee | null} employee: The employee data corresponding to the user.
 *  - {boolean} isLoading: True if an auth operation is in progress.
 *  - {Error | null} error: Any error encountered during auth operations.
 *  - {Function} signIn: Function to sign in with email and password.
 *  - {Function} signOut: Function to sign out the current user.
 *  - {Function} checkAuth: Function to manually trigger an auth state check.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    employee: null,
    isLoading: true,
    error: null,
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Perform the initial authentication check when the component mounts.
    checkAuth()

    /**
     * Subscribe to authentication state changes.
     * If the user signs in, re-check authentication to update state.
     * If the user signs out, clear the state and redirect to the login page.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        await checkAuth()
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          employee: null,
          isLoading: false,
          error: null,
        })
        router.push('/login')
      }
    })

    // Clean up the subscription when the component unmounts.
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Checks the current authentication status of the user.
   *
   * Retrieves the authenticated user and associated employee data from Supabase.
   * Updates the state based on the results. If no user is authenticated, clears the state.
   *
   * @async
   * @function checkAuth
   * @throws {Error} Throws an error if retrieving the user or employee data fails.
   */
  async function checkAuth() {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Retrieve the current authenticated user.
      const { user, error: userError } = await getAuthenticatedUser()
      if (userError) throw userError

      // If no user is found, update state accordingly.
      if (!user) {
        setState({
          user: null,
          employee: null,
          isLoading: false,
          error: null,
        })
        return
      }

      // Retrieve the employee data corresponding to the authenticated user.
      const { employee, error: employeeError } = await getEmployeeData()
      if (employeeError) throw employeeError

      // Update state with the retrieved user and employee data.
      setState({
        user,
        employee,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Auth check failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Auth check failed'),
      }))
    }
  }

  /**
   * Signs in a user using the provided email and password.
   *
   * Initiates the sign-in process, updates state during the operation,
   * and redirects the user to the dashboard upon successful sign-in.
   *
   * @async
   * @function signIn
   * @param {string} email - The email address for authentication.
   * @param {string} password - The password for authentication.
   * @returns {Promise<void>}
   * @throws {Error} Throws an error if sign-in fails.
   */
  async function signIn(email: string, password: string) {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/overview')
    } catch (error) {
      console.error('Sign in failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Sign in failed'),
      }))
      throw error
    }
  }

  /**
   * Signs out the currently authenticated user.
   *
   * Initiates the sign-out process, clears the authentication state,
   * and redirects the user to the login page upon successful sign-out.
   *
   * @async
   * @function signOut
   * @returns {Promise<void>}
   * @throws {Error} Throws an error if sign-out fails.
   */
  async function signOut() {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setState({
        user: null,
        employee: null,
        isLoading: false,
        error: null,
      })

      router.push('/login')
    } catch (error) {
      console.error('Sign out failed:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Sign out failed'),
      }))
      throw error
    }
  }

  // Return the auth state and action functions to be used by consuming components.
  return {
    user: state.user,
    employee: state.employee,
    isLoading: state.isLoading,
    error: state.error,
    signIn,
    signOut,
    checkAuth,
  }
}