import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'
import { mockAuthUser, mockAuthError } from '@/test/helpers/auth'
import { rateLimit } from '@/middleware/rate-limit'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }))
}))

// Mock rate limiting
vi.mock('@/middleware/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue(null)
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully log in a dispatcher', async () => {
    // Mock auth user
    const { supabase } = mockAuthUser('dispatcher')
    
    // Create request
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Call route handler
    const response = await POST(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(200)
    expect(data).toEqual({
      redirectTo: '/overview'
    })

    // Verify Supabase calls
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(supabase.from).toHaveBeenCalledWith('auth_logs')
  })

  it('should handle invalid credentials', async () => {
    // Mock auth error
    mockAuthError('Invalid login credentials', 400)
    
    // Create request
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrongpass'
      })
    })

    // Call route handler
    const response = await POST(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('should redirect to profile completion if employee record not found', async () => {
    // Mock auth user but return null for employee
    const { supabase } = mockAuthUser('dispatcher')
    supabase.from().single.mockResolvedValueOnce({
      data: null,
      error: null
    })
    
    // Create request
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Call route handler
    const response = await POST(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(200)
    expect(data).toEqual({
      redirectTo: '/complete-profile'
    })
  })

  it('should respect rate limiting', async () => {
    // Mock rate limit exceeded
    ;(rateLimit as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 429,
      headers: { 'Retry-After': '60' }
    })
    
    // Create request
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Call route handler
    const response = await POST(request)

    // Verify response
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
  })

  it('should handle database errors gracefully', async () => {
    // Mock auth user but simulate database error
    const { supabase } = mockAuthUser('dispatcher')
    supabase.from().single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error', code: 'PGRST301' }
    })
    
    // Create request
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Call route handler
    const response = await POST(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('should handle malformed request body', async () => {
    // Create request with invalid body
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: 'invalid json'
    })

    // Call route handler
    const response = await POST(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error')
  })
}) 