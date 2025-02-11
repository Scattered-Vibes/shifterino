import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/signout/route'
import { mockAuthUser, mockUnauthenticated } from '@/test/helpers/auth'

describe('POST /api/auth/signout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully sign out an authenticated user', async () => {
    // Mock authenticated user
    const { supabase } = mockAuthUser('dispatcher')
    
    // Create request
    const request = new NextRequest('http://localhost/api/auth/signout', {
      method: 'POST'
    })

    // Call route handler
    const response = await POST(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(200)
    expect(data).toEqual({
      message: 'Signed out successfully'
    })

    // Verify Supabase calls
    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(supabase.from).toHaveBeenCalledWith('auth_logs')
  })

  it('should handle signout for unauthenticated user', async () => {
    // Mock unauthenticated state
    const { supabase } = mockUnauthenticated()
    
    // Create request
    const request = new NextRequest('http://localhost/api/auth/signout', {
      method: 'POST'
    })

    // Call route handler
    const response = await POST(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(200)
    expect(data).toEqual({
      message: 'Signed out successfully'
    })

    // No auth log should be created since there was no user
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('should handle signout error gracefully', async () => {
    // Mock authenticated user with signout error
    const { supabase } = mockAuthUser('dispatcher')
    supabase.auth.signOut.mockResolvedValueOnce({
      error: { message: 'Failed to sign out', status: 500 }
    })
    
    // Create request
    const request = new NextRequest('http://localhost/api/auth/signout', {
      method: 'POST'
    })

    // Call route handler
    const response = await POST(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error')
  })

  it('should handle auth log error gracefully', async () => {
    // Mock authenticated user with log error
    const { supabase } = mockAuthUser('dispatcher')
    supabase.from().insert.mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed to log signout', code: 'PGRST301' }
    })
    
    // Create request
    const request = new NextRequest('http://localhost/api/auth/signout', {
      method: 'POST'
    })

    // Call route handler
    const response = await POST(request)
    const data = await response.json()

    // Verify response is still successful even if logging failed
    expect(response.status).toBe(200)
    expect(data).toEqual({
      message: 'Signed out successfully'
    })
  })

  it('should reject non-POST methods', async () => {
    // Create GET request
    const request = new NextRequest('http://localhost/api/auth/signout', {
      method: 'GET'
    })

    // Call route handler
    const response = await POST(request)
    const data = await response.json()

    // Verify response
    expect(response.status).toBe(405)
    expect(data).toEqual({
      error: 'Method not allowed'
    })
  })
}) 