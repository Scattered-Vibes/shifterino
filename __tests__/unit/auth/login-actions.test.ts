import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login } from '@/app/(auth)/actions/login'
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

describe('Login Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles successful login', async () => {
    const mockSupabase = setupAuthMocks({ authenticated: true })
    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'password123')

    const result = await login(null, formData)

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(result).toBeUndefined() // Redirects on success
  })

  it('handles login failure', async () => {
    const mockSupabase = setupAuthMocks({ authenticated: false })
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    })

    const formData = new FormData()
    formData.append('email', 'wrong@example.com')
    formData.append('password', 'wrongpass')

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

  it('handles network errors', async () => {
    const mockError = new Error('Network error')
    setupAuthMocks({ authenticated: false, error: mockError })
    
    const formData = createFormData({
      email: 'test@example.com',
      password: 'password123'
    })

    const result = await login(null, formData)
    expect(result).toEqual({
      error: { message: 'Network error' }
    })
  })

  it('uses default redirect path when not provided', async () => {
    setupAuthMocks({ authenticated: true })
    
    const formData = createFormData({
      email: 'test@example.com',
      password: 'password123'
    })

    const result = await login(null, formData)
    expect(result).toBeUndefined() // Action redirects to /overview by default
  })
}) 