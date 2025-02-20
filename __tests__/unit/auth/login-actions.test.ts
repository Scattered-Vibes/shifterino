import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login } from '@/app/(auth)/login/actions'
import { setupAuthMocks, createFormData, mockUser, mockSession } from '../../helpers/auth'
import { cookies } from 'next/headers'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }))
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('login action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns success state on valid login', async () => {
    const mockSupabase = setupAuthMocks({ authenticated: true })
    const formData = createFormData({
      email: 'test@example.com',
      password: 'password123'
    })

    const result = await login(null, formData)

    expect(result).toEqual({
      success: true,
      redirectTo: '/overview'
    })

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })

    // Verify cookies were set
    const cookieStore = cookies()
    expect(cookieStore.set).toHaveBeenCalledWith({
      name: 'sb-access-token',
      value: mockSession.access_token,
      httpOnly: true,
      secure: expect.any(Boolean),
      sameSite: 'lax',
      path: '/'
    })
  })

  it('returns error state on invalid credentials', async () => {
    setupAuthMocks({ authenticated: false })
    const formData = createFormData({
      email: 'test@example.com',
      password: 'wrong'
    })

    const result = await login(null, formData)

    expect(result).toEqual({
      error: { message: 'Invalid credentials' }
    })
  })

  it('returns error state on missing email', async () => {
    const formData = createFormData({
      email: '',
      password: 'password123'
    })

    const result = await login(null, formData)

    expect(result).toEqual({
      error: { message: 'Email and password are required.' }
    })
  })

  it('returns error state on missing password', async () => {
    const formData = createFormData({
      email: 'test@example.com',
      password: ''
    })

    const result = await login(null, formData)

    expect(result).toEqual({
      error: { message: 'Email and password are required.' }
    })
  })

  it('handles unexpected errors', async () => {
    const mockSupabase = setupAuthMocks({ authenticated: false })
    // Override the mock to simulate a network error
    mockSupabase.auth.signInWithPassword = vi.fn().mockRejectedValue(new Error('Network error'))

    const formData = createFormData({
      email: 'test@example.com',
      password: 'password123'
    })

    const result = await login(null, formData)

    expect(result).toEqual({
      error: { message: 'Network error' }
    })
  })

  it('uses custom redirectTo when provided', async () => {
    setupAuthMocks({ authenticated: true })
    const formData = createFormData({
      email: 'test@example.com',
      password: 'password123',
      redirectTo: '/custom-page'
    })

    const result = await login(null, formData)

    expect(result).toEqual({
      success: true,
      redirectTo: '/custom-page'
    })
  })
}) 