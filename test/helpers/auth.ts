import { vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import type { AuthResult } from '@/app/lib/auth/middleware'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

/**
 * Auth Test Helpers
 * 
 * This module provides mock implementations for authentication-related functionality.
 * We intentionally mock only the specific Supabase client methods that we need for testing,
 * rather than implementing the entire SupabaseClient interface.
 * 
 * Type assertions are used deliberately to handle the partial mock implementation,
 * as we only need specific methods for our tests. While this causes some linter warnings,
 * it's acceptable for our testing purposes where we only use the implemented methods.
 */

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {
    provider: 'email'
  }
}

export const mockEmployees = {
  dispatcher: {
    id: 'dispatcher-id',
    auth_id: mockUser.id,
    role: 'dispatcher' as const,
    team_id: 'team-1'
  },
  supervisor: {
    id: 'supervisor-id',
    auth_id: mockUser.id,
    role: 'supervisor' as const,
    team_id: 'team-1'
  },
  manager: {
    id: 'manager-id',
    auth_id: mockUser.id,
    role: 'manager' as const
  }
}

/**
 * Type definitions for our minimal mock implementation.
 * We only define types for the methods we actually use in tests.
 */
type MockAuthResponse<T> = {
  data: T
  error: null | {
    message: string
    status: number
    name: string
  }
}

// Note: We use Pick to indicate we're only implementing specific parts of SupabaseClient
type MockSupabaseClient = Pick<SupabaseClient<Database>, 'auth' | 'from'> & {
  auth: {
    getUser(): Promise<MockAuthResponse<{ user: typeof mockUser | null }>>
    signInWithPassword(): Promise<MockAuthResponse<{ user: typeof mockUser }>>
    signOut(): Promise<{ error: null }>
  }
}

/**
 * Creates a mock authenticated user with the specified role.
 * @param role - The role to assign to the mock user
 */
export function mockAuthUser(role: keyof typeof mockEmployees) {
  const employee = mockEmployees[role]
  
  // We use type assertions here as we're only implementing the methods we need
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: employee,
        error: null
      })
    })
  } satisfies MockSupabaseClient

  vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as SupabaseClient<Database>)

  return {
    user: mockUser,
    employee,
    mockSupabase
  }
}

/**
 * Creates a mock unauthenticated state
 */
export function mockUnauthenticated() {
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      })
    }
  } satisfies Pick<MockSupabaseClient, 'auth'>

  vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as SupabaseClient<Database>)
}

/**
 * Creates a mock authentication error state
 */
export function mockAuthError(message: string, status = 400) {
  const error = {
    name: 'AuthError',
    message,
    status,
  }
  
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error
      })
    }
  } satisfies Pick<MockSupabaseClient, 'auth'>

  vi.mocked(createClient).mockReturnValue(mockSupabase as unknown as SupabaseClient<Database>)
}

/**
 * Creates a mock AuthResult object for the specified role
 */
export function getMockAuthResult(role: keyof typeof mockEmployees): AuthResult {
  const employee = mockEmployees[role]
  return {
    userId: mockUser.id,
    employeeId: employee.id,
    role: employee.role,
    teamId: 'team_id' in employee ? employee.team_id : undefined
  }
} 