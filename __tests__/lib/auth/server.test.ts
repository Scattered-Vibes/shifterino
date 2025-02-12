import { getUser, requireAuth } from '@/lib/auth/server'
import { createMockSupabaseClient, createMockUser } from '@/test/supabase-mock'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { redirect } from 'next/navigation'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

describe('Auth Server Functions', () => {
  let mockSupabase = createMockSupabaseClient()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
  })

  describe('getUser', () => {
    it('should return authenticated user when session exists', async () => {
      const mockUser = createMockUser()
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      const result = await getUser()

      expect(result).toEqual(mockUser)
    })

    it('should return null when no session exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      })

      const result = await getUser()

      expect(result).toBeNull()
    })

    it('should handle Supabase errors', async () => {
      const mockError = new Error('Failed to get user')
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: mockError
      })

      const result = await getUser()

      expect(result).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('should return authenticated user data when fully authenticated', async () => {
      const mockUser = createMockUser()
      const mockEmployee = {
        id: 'emp-1',
        role: 'dispatcher' as const,
        auth_id: mockUser.id
      }

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      const mockFrom = mockSupabase.from as jest.Mock
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockEmployee,
          error: null
        })
      })

      const result = await requireAuth()

      expect(result).toEqual({
        userId: mockUser.id,
        employeeId: mockEmployee.id,
        role: mockEmployee.role,
        email: mockUser.email,
        isNewUser: false
      })
    })

    it('should redirect to login when no session exists', async () => {
      const redirectMock = vi.mocked(redirect)
      
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('No session')
      })

      await requireAuth()

      expect(redirectMock).toHaveBeenCalledWith('/login')
    })

    it('should redirect to complete-profile for new users', async () => {
      const redirectMock = vi.mocked(redirect)
      const mockUser = createMockUser()

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      const mockFrom = mockSupabase.from as jest.Mock
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Employee not found' }
        })
      })

      await requireAuth()

      expect(redirectMock).toHaveBeenCalledWith('/complete-profile')
    })

    it('should not redirect new users when allowIncomplete is true', async () => {
      const redirectMock = vi.mocked(redirect)
      const mockUser = createMockUser()

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      const mockFrom = mockSupabase.from as jest.Mock
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Employee not found' }
        })
      })

      const result = await requireAuth(true)

      expect(redirectMock).not.toHaveBeenCalledWith('/complete-profile')
      expect(result).toEqual({
        userId: mockUser.id,
        employeeId: '',
        role: 'dispatcher',
        email: mockUser.email,
        isNewUser: true
      })
    })
  })
}) 