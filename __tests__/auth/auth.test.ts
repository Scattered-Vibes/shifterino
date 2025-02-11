import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { getUser, requireAuth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}))

describe('Auth Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSupabase = createClient()
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const user = await getUser()
      expect(user).toEqual(mockUser)
    })

    it('should throw error when auth fails', async () => {
      const mockSupabase = createClient()
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Auth failed'),
      })

      await expect(getUser()).rejects.toThrow('Auth failed')
    })
  })

  describe('requireAuth', () => {
    it('should redirect to login when no user', async () => {
      const mockSupabase = createClient()
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      })

      await requireAuth()
      expect(redirect).toHaveBeenCalledWith('/login')
    })

    it('should return user data when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockEmployee = {
        id: 'emp123',
        role: 'dispatcher',
        first_name: 'Test',
        last_name: 'User',
      }

      const mockSupabase = createClient()
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockEmployee }),
          }),
        }),
      } as any)

      const result = await requireAuth()
      expect(result).toEqual({
        userId: mockUser.id,
        employeeId: mockEmployee.id,
        role: mockEmployee.role,
        email: mockUser.email,
        isNewUser: false,
      })
    })

    it('should redirect to complete-profile for new users', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockEmployee = {
        id: 'emp123',
        role: 'dispatcher',
        first_name: '',
        last_name: '',
      }

      const mockSupabase = createClient()
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockEmployee }),
          }),
        }),
      } as any)

      await requireAuth()
      expect(redirect).toHaveBeenCalledWith('/complete-profile')
    })
  })
})