import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSessionUser, requireAuth } from '@/lib/auth/server'
import { mockAuthUser, mockUnauthenticated, mockAuthError } from '../../../test/helpers/auth'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('@/lib/auth/server', () => ({
  getSessionUser: vi.fn(),
  requireAuth: vi.fn()
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn()
}))

describe('auth/server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSessionUser', () => {
    it('returns user when authenticated', async () => {
      const { user } = mockAuthUser('dispatcher')
      vi.mocked(getSessionUser).mockResolvedValue(user)
      const result = await getSessionUser()
      expect(result).toEqual(user)
    })

    it('returns null when not authenticated', async () => {
      mockUnauthenticated()
      vi.mocked(getSessionUser).mockResolvedValue(null)
      const result = await getSessionUser()
      expect(result).toBeNull()
    })

    it('returns null on auth error', async () => {
      mockAuthError('Auth error')
      vi.mocked(getSessionUser).mockResolvedValue(null)
      const result = await getSessionUser()
      expect(result).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('returns authenticated user data when user is logged in', async () => {
      const { user, employee } = mockAuthUser('dispatcher')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: employee, error: null })
            })
          })
        })
      }
      vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(getSessionUser).mockResolvedValue(user)

      const result = await requireAuth()
      expect(result).toEqual({
        userId: user.id,
        employeeId: employee.id,
        role: employee.role,
        email: user.email,
        isNewUser: false,
        firstName: employee.first_name,
        lastName: employee.last_name
      })
    })

    it('redirects to login when user is not authenticated', async () => {
      vi.mocked(getSessionUser).mockResolvedValue(null)
      await requireAuth()
      expect(redirect).toHaveBeenCalledWith('/login')
    })

    it('redirects to login on auth error', async () => {
      vi.mocked(getSessionUser).mockRejectedValue(new Error('Auth error'))
      await expect(requireAuth()).rejects.toThrow('Auth error')
    })

    it('redirects to complete-profile when no employee record exists', async () => {
      const { user } = mockAuthUser('dispatcher')
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        })
      }
      vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(getSessionUser).mockResolvedValue(user)

      await requireAuth()
      expect(redirect).toHaveBeenCalledWith('/complete-profile')
    })

    it('redirects to complete-profile when profile is incomplete and allowIncomplete=false', async () => {
      const { user } = mockAuthUser('dispatcher')
      const incompleteEmployee = {
        id: 'emp123',
        role: 'dispatcher',
        first_name: null,
        last_name: null
      }
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: incompleteEmployee, error: null })
            })
          })
        })
      }
      vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(getSessionUser).mockResolvedValue(user)

      await requireAuth(false)
      expect(redirect).toHaveBeenCalledWith('/complete-profile')
    })

    it('allows incomplete profile when allowIncomplete=true', async () => {
      const { user } = mockAuthUser('dispatcher')
      const incompleteEmployee = {
        id: 'emp123',
        role: 'dispatcher',
        first_name: null,
        last_name: null
      }
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: incompleteEmployee, error: null })
            })
          })
        })
      }
      vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any)
      vi.mocked(getSessionUser).mockResolvedValue(user)

      const result = await requireAuth(true)
      expect(result).toEqual({
        userId: user.id,
        employeeId: incompleteEmployee.id,
        role: incompleteEmployee.role,
        email: user.email,
        isNewUser: true,
        firstName: null,
        lastName: null
      })
    })
  })
})