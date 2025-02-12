import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/api/auth/callback/route'
import { mockAuthUser } from '@/test/auth'

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully handle auth callback with code', async () => {
    // Mock authenticated user
    const { supabase } = mockAuthUser('dispatcher')
    
    // Create request with auth code
    const request = new NextRequest('http://localhost/api/auth/callback?code=test-auth-code', {
      method: 'GET'
    })

    // Call route handler
    const response = await GET(request)

    // Verify response
    expect(response.status).toBe(302) // Redirect
    expect(response.headers.get('Location')).toBe('http://localhost/overview')

    // Verify Supabase calls
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-auth-code')
    expect(supabase.from).toHaveBeenCalledWith('auth_logs')
  })

  it('should redirect to login on missing code', async () => {
    // Create request without code
    const request = new NextRequest('http://localhost/api/auth/callback', {
      method: 'GET'
    })

    // Call route handler
    const response = await GET(request)

    // Verify response
    expect(response.status).toBe(302) // Redirect
    expect(response.headers.get('Location')).toBe('http://localhost/login?error=missing_code')
  })

  it('should handle session exchange error', async () => {
    // Mock authenticated user with exchange error
    const { supabase } = mockAuthUser('dispatcher')
    supabase.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Invalid code', status: 400 }
    })
    
    // Create request with auth code
    const request = new NextRequest('http://localhost/api/auth/callback?code=invalid-code', {
      method: 'GET'
    })

    // Call route handler
    const response = await GET(request)

    // Verify response
    expect(response.status).toBe(302) // Redirect
    expect(response.headers.get('Location')).toBe('http://localhost/login?error=auth_error')
  })

  it('should handle auth log error gracefully', async () => {
    // Mock authenticated user with log error
    const { supabase } = mockAuthUser('dispatcher')
    supabase.from().insert.mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed to log callback', code: 'PGRST301' }
    })
    
    // Create request with auth code
    const request = new NextRequest('http://localhost/api/auth/callback?code=test-auth-code', {
      method: 'GET'
    })

    // Call route handler
    const response = await GET(request)

    // Verify response is still successful even if logging failed
    expect(response.status).toBe(302) // Redirect
    expect(response.headers.get('Location')).toBe('http://localhost/overview')
  })

  it('should handle unexpected errors gracefully', async () => {
    // Mock authenticated user with unexpected error
    const { supabase } = mockAuthUser('dispatcher')
    supabase.auth.exchangeCodeForSession.mockRejectedValueOnce(
      new Error('Unexpected error')
    )
    
    // Create request with auth code
    const request = new NextRequest('http://localhost/api/auth/callback?code=test-auth-code', {
      method: 'GET'
    })

    // Call route handler
    const response = await GET(request)

    // Verify response
    expect(response.status).toBe(302) // Redirect
    expect(response.headers.get('Location')).toBe('http://localhost/login?error=server_error')
  })
}) 