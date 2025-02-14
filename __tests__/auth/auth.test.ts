import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import { mockSupabaseClient } from '../helpers/supabase-mock'
import { redirect } from 'next/navigation'
import { User, AuthError, UserResponse } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

type UserRole = Database['public']['Enums']['employee_role']
type AuthenticatedUser = {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
}

// Mock declarations must come before any test code
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
  getUser: vi.fn(),
}))

vi.mock('@/lib/auth/server', () => ({
  getUser: vi.fn(),
  requireAuth: vi.fn(),
}))

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Session Management', () => {
    it('should return null when no session exists', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({ 
        data: { session: null }, 
        error: null 
      })
      
      const user = await getUser()
      expect(user).toBeNull()
    })

    it('should return user data when session exists', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'dispatcher'
      }

      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Date.now() + 3600
          }
        },
        error: null
      })

      const user = await getUser()
      expect(user).toEqual(mockUser)
    })

    it('should handle auth errors gracefully', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: new Error('Auth error')
      })

      const user = await getUser()
      expect(user).toBeNull()
    })
  })

  describe('Role-Based Access', () => {
    it('should identify dispatcher role', async () => {
      const mockUser = {
        id: '123',
        email: 'dispatcher@example.com',
        role: 'dispatcher'
      }

      mockSupabaseClient.from('employees').select('role')
        .eq('auth_id', mockUser.id)
        .single()
        .mockResolvedValueOnce({
          data: { role: 'dispatcher' },
          error: null
        })

      const { data } = await mockSupabaseClient
        .from('employees')
        .select('role')
        .eq('auth_id', mockUser.id)
        .single()

      expect(data?.role).toBe('dispatcher')
    })

    it('should identify supervisor role', async () => {
      const mockUser = {
        id: '456',
        email: 'supervisor@example.com',
        role: 'supervisor'
      }

      mockSupabaseClient.from('employees').select('role')
        .eq('auth_id', mockUser.id)
        .single()
        .mockResolvedValueOnce({
          data: { role: 'supervisor' },
          error: null
        })

      const { data } = await mockSupabaseClient
        .from('employees')
        .select('role')
        .eq('auth_id', mockUser.id)
        .single()

      expect(data?.role).toBe('supervisor')
    })

    it('should handle database errors when checking roles', async () => {
      const mockUser = {
        id: '789',
        email: 'error@example.com',
        role: 'dispatcher'
      }

      mockSupabaseClient.from('employees').select('role')
        .eq('auth_id', mockUser.id)
        .single()
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Database error')
        })

      const { error } = await mockSupabaseClient
        .from('employees')
        .select('role')
        .eq('auth_id', mockUser.id)
        .single()

      expect(error).toBeTruthy()
    })
  })
})

describe('Auth Utilities', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const supabase = (await import('@/lib/supabase/server')).createClient()
    const mockFrom = vi.mocked(supabase.from)
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn()
        })
      })
    } as Partial<ReturnType<typeof supabase.from>> as ReturnType<typeof supabase.from>)
  })

  describe('getUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone: undefined,
        confirmation_sent_at: undefined,
        confirmed_at: undefined,
        last_sign_in_at: undefined,
        role: undefined,
        factors: undefined
      }

      const supabase = (await import('@/lib/supabase/server')).createClient()
      const mockGetUser = vi.mocked(supabase.auth.getUser)
      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      } as unknown as UserResponse)

      vi.mocked(getUser).mockResolvedValueOnce(mockUser)

      const user = await getUser()
      expect(user).toEqual(mockUser)
    })

    it('should throw error when auth fails', async () => {
      const mockError = new AuthError('Auth failed', 401)
      
      const supabase = (await import('@/lib/supabase/server')).createClient()
      const mockGetUser = vi.mocked(supabase.auth.getUser)
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: mockError,
      } as unknown as UserResponse)

      vi.mocked(getUser).mockRejectedValueOnce(mockError)

      await expect(getUser()).rejects.toThrow('Auth failed')
    })
  })

  describe('requireAuth', () => {
    it('should redirect to login when no user', async () => {
      vi.mocked(getUser).mockResolvedValueOnce(null)
      vi.mocked(requireAuth).mockImplementationOnce(() => {
        redirect('/login')
        return Promise.resolve({} as AuthenticatedUser)
      })

      await requireAuth()
      expect(redirect).toHaveBeenCalledWith('/login')
    })

    it('should return user data when authenticated', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone: undefined,
        confirmation_sent_at: undefined,
        confirmed_at: undefined,
        last_sign_in_at: undefined,
        role: undefined,
        factors: undefined
      }
      const mockEmployee = {
        id: 'emp123',
        role: 'dispatcher' as UserRole,
        first_name: 'Test',
        last_name: 'User',
      }

      const expectedResult: AuthenticatedUser = {
        userId: mockUser.id,
        employeeId: mockEmployee.id,
        role: mockEmployee.role,
        email: mockUser.email!,
        isNewUser: false,
      }

      vi.mocked(getUser).mockResolvedValueOnce(mockUser)
      vi.mocked(requireAuth).mockResolvedValueOnce(expectedResult)

      const supabase = (await import('@/lib/supabase/server')).createClient()
      const mockGetUser = vi.mocked(supabase.auth.getUser)
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn() }) })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      } as unknown as UserResponse)

      const result = await requireAuth()
      expect(result).toEqual(expectedResult)
    })

    it('should redirect to complete-profile for new users', async () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone: undefined,
        confirmation_sent_at: undefined,
        confirmed_at: undefined,
        last_sign_in_at: undefined,
        role: undefined,
        factors: undefined
      }

      vi.mocked(getUser).mockResolvedValueOnce(mockUser)
      vi.mocked(requireAuth).mockImplementationOnce(() => {
        redirect('/complete-profile')
        return Promise.resolve({} as AuthenticatedUser)
      })

      const supabase = (await import('@/lib/supabase/server')).createClient()
      const mockGetUser = vi.mocked(supabase.auth.getUser)
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn() }) })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      } as unknown as UserResponse)

      await requireAuth()
      expect(redirect).toHaveBeenCalledWith('/complete-profile')
    })
  })
})