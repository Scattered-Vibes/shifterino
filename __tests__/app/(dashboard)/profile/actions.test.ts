import { describe, it, expect, vi } from 'vitest'
import { createMockSupabaseClient, createMockUser } from '@/test/supabase-mock'
import { updateProfile } from '@/(dashboard)/profile/actions'
import { AuthApiError } from '@supabase/supabase-js'
import type { UpdateProfileInput } from '@/types/profile'

describe('Profile Actions', () => {
  it('updates user profile successfully', async () => {
    const mockSupabase = createMockSupabaseClient()
    const mockUser = createMockUser({
      email: 'test@example.com',
      user_metadata: {
        first_name: 'John',
        last_name: 'Doe'
      }
    })

    vi.spyOn(mockSupabase.auth, 'updateUser').mockResolvedValueOnce({
      data: { user: mockUser },
      error: null
    })

    const profileData: UpdateProfileInput = {
      id: '123',
      auth_id: '456',
      first_name: 'John',
      last_name: 'Doe',
      email: mockUser.email || 'test@example.com',
      role: 'dispatcher',
      shift_pattern: 'pattern_a',
      preferred_shift_category: 'day'
    }

    const result = await updateProfile(profileData)

    expect(result.success).toBe(true)
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: {
        first_name: 'John',
        last_name: 'Doe'
      }
    })
  })

  it('handles update error', async () => {
    const mockSupabase = createMockSupabaseClient()
    const mockError = new AuthApiError('Update failed', 400, 'invalid_request')

    vi.spyOn(mockSupabase.auth, 'updateUser').mockResolvedValueOnce({
      data: { user: null },
      error: mockError
    })

    const profileData: UpdateProfileInput = {
      id: '123',
      auth_id: '456', 
      first_name: 'John',
      last_name: 'Doe',
      email: 'test@example.com',
      role: 'dispatcher',
      shift_pattern: 'pattern_a',
      preferred_shift_category: 'day'
    }

    const result = await updateProfile(profileData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Update failed')
  })
}) 