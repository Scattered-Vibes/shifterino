'use client'

import { createContext, useContext, useEffect, useReducer, ReactNode, useMemo, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { createBrowserClient } from '@supabase/ssr'
import type { Employee } from '@/types/models/employee'
import { toast } from '@/components/ui/use-toast'

// Create the Supabase client at module level
const supabaseClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Constants
const FETCH_TIMEOUT = 5000 // 5 seconds timeout
const RETRY_DELAY = 1000 // 1 second retry delay

// Define the state interface
interface SupabaseState {
  user: User | null
  employee: Employee | null
  isLoading: boolean
  error: Error | null
}

// Define the context value interface
interface SupabaseContextValue extends SupabaseState {
  supabase: typeof supabaseClient
  refreshEmployee: () => Promise<void>
}

// Create the context with undefined as initial value
const Context = createContext<SupabaseContextValue | undefined>(undefined)

// Define action types
type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_EMPLOYEE'; payload: Employee | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'RESET_STATE' }
  | { type: 'SET_AUTH_COMPLETE' }

// Reducer function with enhanced logging
function supabaseReducer(state: SupabaseState, action: Action): SupabaseState {
  console.log('[SupabaseProvider] Reducer action:', action.type, 'Current state:', {
    hasUser: !!state.user,
    hasEmployee: !!state.employee,
    isLoading: state.isLoading,
    hasError: !!state.error
  })

  let newState: SupabaseState
  switch (action.type) {
    case 'SET_USER':
      newState = { ...state, user: action.payload, error: null }
      break
    case 'SET_EMPLOYEE':
      newState = { 
        ...state, 
        employee: action.payload, 
        error: null,
        isLoading: false 
      }
      break
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload }
      break
    case 'SET_ERROR':
      newState = { 
        ...state, 
        error: action.payload, 
        isLoading: false
      }
      break
    case 'RESET_STATE':
      newState = {
        user: null,
        employee: null,
        isLoading: false,
        error: null
      }
      break
    case 'SET_AUTH_COMPLETE':
      newState = {
        ...state,
        isLoading: false
      }
      break
    default:
      return state
  }

  console.log('[SupabaseProvider] New state after', action.type, ':', {
    hasUser: !!newState.user,
    hasEmployee: !!newState.employee,
    isLoading: newState.isLoading,
    hasError: !!newState.error
  })
  
  return newState
}

interface SupabaseProviderProps {
  children: ReactNode
  initialData?: {
    user: User | null
    employee: Employee | null
  }
}

export function SupabaseProvider({ children, initialData }: SupabaseProviderProps) {
  const supabase = useMemo(() => supabaseClient, [])
  const fetchInProgress = useRef<Set<string>>(new Set())
  const retryCount = useRef<Record<string, number>>({})

  const [state, dispatch] = useReducer(supabaseReducer, {
    user: initialData?.user ?? null,
    employee: initialData?.employee ?? null,
    isLoading: !initialData,
    error: null,
  })

  const fetchEmployee = useCallback(async (userId: string, isRetry = false) => {
    // Skip if fetch already in progress for this user
    if (fetchInProgress.current.has(userId)) {
      console.log('[SupabaseProvider] Skipping duplicate fetch for user:', userId)
      return
    }

    // Skip initial fetch if we already have employee data
    if (!isRetry && state.employee?.auth_id === userId) {
      console.log('[SupabaseProvider] Using existing employee data for user:', userId)
      return
    }

    // Track this fetch attempt
    fetchInProgress.current.add(userId)
    if (!isRetry) {
      retryCount.current[userId] = 0
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Employee fetch timed out')), FETCH_TIMEOUT)
    )

    try {
      console.log('[SupabaseProvider] Starting employee fetch for user:', userId, 
        isRetry ? `(Retry ${retryCount.current[userId]})` : '')
      
      if (!isRetry) {
        dispatch({ type: 'SET_LOADING', payload: true })
      }

      const fetchPromise = supabase
        .from('employees')
        .select('*')
        .eq('auth_id', userId)
        .single()

      const { data: employee, error: employeeError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ])

      if (employeeError) {
        if (employeeError.code === 'PGRST116') {
          console.log('[SupabaseProvider] No employee record found for user:', userId)
          dispatch({ type: 'SET_EMPLOYEE', payload: null })
          toast({
            title: 'Profile Incomplete',
            description: 'Please complete your employee profile',
            variant: 'default',
          })
        } else {
          throw employeeError
        }
      } else {
        console.log('[SupabaseProvider] Employee fetched successfully:', {
          id: employee?.id,
          hasData: !!employee
        })
        dispatch({ type: 'SET_EMPLOYEE', payload: employee as Employee })
        // Clear retry count on success
        delete retryCount.current[userId]
      }
    } catch (error) {
      console.error('[SupabaseProvider] Error in fetchEmployee:', error)
      const isTimeout = error instanceof Error && error.message.includes('timed out')
      
      // Handle retry logic with exponential backoff
      if (isTimeout && (!retryCount.current[userId] || retryCount.current[userId] < 2)) {
        retryCount.current[userId] = (retryCount.current[userId] || 0) + 1
        const retryDelay = Math.min(RETRY_DELAY * Math.pow(2, retryCount.current[userId] - 1), 5000)
        console.log(`[SupabaseProvider] Scheduling retry ${retryCount.current[userId]} for user:`, userId, `with delay: ${retryDelay}ms`)
        
        toast({
          title: 'Loading Profile',
          description: 'Taking longer than expected. Retrying...',
          variant: 'default',
        })

        setTimeout(() => {
          fetchEmployee(userId, true)
        }, retryDelay)
        return
      }

      dispatch({ type: 'SET_ERROR', payload: error as Error })
      toast({
        title: 'Error',
        description: isTimeout 
          ? 'Failed to load profile after multiple attempts. Please refresh.' 
          : 'Failed to fetch employee data. Please try again later.',
        variant: 'destructive',
      })
    } finally {
      console.log('[SupabaseProvider] fetchEmployee completed for user:', userId)
      fetchInProgress.current.delete(userId)
      dispatch({ type: 'SET_AUTH_COMPLETE' })
    }
  }, [supabase, state.employee])

  const refreshEmployee = useCallback(async () => {
    if (!state.user?.id) {
      console.log('[SupabaseProvider] No user ID for refresh')
      return
    }
    await fetchEmployee(state.user.id)
  }, [fetchEmployee, state.user?.id])

  useEffect(() => {
    let mounted = true
    console.log('[SupabaseProvider] Setting up auth effect')

    // Skip initial auth check if we have initialData
    if (initialData) {
      console.log('[SupabaseProvider] Using initial data, skipping auth check')
      return
    }

    async function initializeAuth() {
      try {
        console.log('[SupabaseProvider] Initializing auth...')
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!mounted) {
          console.log('[SupabaseProvider] Component unmounted during auth')
          return
        }

        if (userError) {
          console.error('[SupabaseProvider] Auth error:', userError)
          throw userError
        }

        if (user) {
          console.log('[SupabaseProvider] User found:', user.id)
          dispatch({ type: 'SET_USER', payload: user })
          await fetchEmployee(user.id)
        } else {
          console.log('[SupabaseProvider] No user found')
          dispatch({ type: 'SET_AUTH_COMPLETE' })
        }
      } catch (error) {
        console.error('[SupabaseProvider] Error initializing auth:', error)
        if (mounted) {
          dispatch({ type: 'SET_ERROR', payload: error as Error })
          toast({
            title: 'Authentication Error',
            description: 'Please try refreshing the page',
            variant: 'destructive',
          })
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        console.log('[SupabaseProvider] Auth state changed:', event)

        try {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session?.user) {
              dispatch({ type: 'SET_USER', payload: session.user })
              await fetchEmployee(session.user.id)
            }
          } else if (event === 'SIGNED_OUT') {
            dispatch({ type: 'RESET_STATE' })
          }
        } catch (error) {
          console.error('[SupabaseProvider] Error handling auth change:', error)
          if (mounted) {
            dispatch({ type: 'SET_ERROR', payload: error as Error })
          }
        }
      }
    )

    return () => {
      console.log('[SupabaseProvider] Cleaning up auth effect')
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchEmployee, initialData])

  const value = useMemo(
    () => ({
      ...state,
      supabase,
      refreshEmployee,
    }),
    [state, supabase, refreshEmployee]
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useSupabase() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}

export type { SupabaseContextValue }