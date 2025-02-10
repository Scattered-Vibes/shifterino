import { vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import type { AuthResult } from '@/lib/auth/middleware'

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

export function mockAuthUser(role: keyof typeof mockEmployees) {
  const employee = mockEmployees[role]
  
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
      }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { 
          session: { access_token: 'test-token', refresh_token: 'test-refresh' },
          user: mockUser
        },
        error: null
      }),
      admin: {
        listUsers: vi.fn().mockResolvedValue({
          data: [],
          error: null
        }),
        deleteUser: vi.fn().mockResolvedValue({
          error: null
        }),
        getUserById: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: employee,
        error: null
      })
    })
  }

  ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase)
  
  return {
    user: mockUser,
    employee,
    supabase: mockSupabase
  }
}

export function mockUnauthenticated() {
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated', status: 401 }
      })
    }
  }

  ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase)
  
  return { supabase: mockSupabase }
}

export function mockAuthError(message: string, status = 400) {
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message, status }
      })
    }
  }

  ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase)
  
  return { supabase: mockSupabase }
}

export function getMockAuthResult(role: keyof typeof mockEmployees): AuthResult {
  const employee = mockEmployees[role]
  const base = {
    userId: mockUser.id,
    role: employee.role,
    employeeId: employee.id
  }
  
  if ('team_id' in employee) {
    return { ...base, teamId: employee.team_id }
  }
  
  return base
} 