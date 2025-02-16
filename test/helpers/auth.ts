import { vi } from 'vitest'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthenticatedUser } from '@/lib/auth/server'
import type { UserRole } from '@/types/auth'

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
  createServerSupabaseClient: vi.fn()
}))

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {
    provider: 'email'
  },
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: undefined,
  updated_at: new Date().toISOString()
}

export const mockEmployees: Record<string, Database['public']['Tables']['employees']['Row']> = {
  dispatcher: {
    id: 'dispatcher-id',
    auth_id: mockUser.id,
    role: 'dispatcher',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    shift_pattern: '4x10',
    weekly_hours_cap: 40,
    max_overtime_hours: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    updated_by: null
  },
  supervisor: {
    id: 'supervisor-id',
    auth_id: mockUser.id,
    role: 'supervisor',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    shift_pattern: '4x10',
    weekly_hours_cap: 40,
    max_overtime_hours: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    updated_by: null
  },
  manager: {
    id: 'manager-id',
    auth_id: mockUser.id,
    role: 'manager',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    shift_pattern: '4x10',
    weekly_hours_cap: 40,
    max_overtime_hours: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    updated_by: null
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
export function mockAuthUser(role: UserRole) {
  const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  }

  const employee = {
    id: 'test-employee-id',
    auth_id: user.id,
    role,
    first_name: 'Test',
    last_name: 'User',
    email: user.email
  }

  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: employee, error: null })
        })
      })
    })
  } as unknown as SupabaseClient<Database>

  vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase)
  return { user, employee, supabase: mockSupabase }
}

/**
 * Creates a mock unauthenticated state
 */
export function mockUnauthenticated() {
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated', status: 401 }
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  } as unknown as SupabaseClient<Database>

  vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase)
  return { supabase: mockSupabase }
}

/**
 * Creates a mock authentication error state
 */
export function mockAuthError(message: string) {
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message, status: 400 }
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message, code: 'AUTH_ERROR' } })
        })
      })
    })
  } as unknown as SupabaseClient<Database>

  vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase)
  return { supabase: mockSupabase }
}

export function mockMissingEmployee() {
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  } as unknown as SupabaseClient<Database>

  vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase)
  return {
    user: mockUser,
    supabase: mockSupabase
  }
}

/**
 * Creates a mock AuthResult object for the specified role
 */
export function getMockAuthResult(role: keyof typeof mockEmployees): AuthenticatedUser {
  const employee = mockEmployees[role]
  return {
    userId: mockUser.id,
    employeeId: employee.id,
    role: employee.role,
    email: employee.email,
    isNewUser: false,
    firstName: employee.first_name,
    lastName: employee.last_name
  }
} 