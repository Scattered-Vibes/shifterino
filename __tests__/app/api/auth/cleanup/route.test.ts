import { POST } from '@/api/auth/cleanup/route'
import { createMockSupabaseClient } from '@/test/supabase-mock'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

interface ApiResponse {
  status: number;
  message?: string;
  error?: string;
}

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      ...data,
      status: init?.status || 200
    }))
  },
  NextRequest: vi.fn()
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => createMockSupabaseClient())
}))

describe('POST /api/auth/cleanup', () => {
  let mockSupabase = createMockSupabaseClient()
  const CLEANUP_SECRET_KEY = process.env.CLEANUP_SECRET_KEY || 'test-secret'

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
  })

  it('should successfully clean up expired sessions', async () => {
    const mockExpiredSessions = [
      { id: 'session-1', expires_at: '2023-01-01T00:00:00Z' },
      { id: 'session-2', expires_at: '2023-01-02T00:00:00Z' }
    ]

    const mockFrom = mockSupabase.from as jest.Mock
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      delete: vi.fn().mockResolvedValueOnce({
        data: mockExpiredSessions,
        error: null
      })
    })

    const request = new NextRequest('http://localhost:3000/api/auth/cleanup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLEANUP_SECRET_KEY}`
      }
    })

    const response = await POST(request) as unknown as ApiResponse

    expect(response.status).toBe(200)
    expect(response.message).toBe('Successfully cleaned up 2 expired sessions')
  })

  it('should return 401 with invalid secret key', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/cleanup', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-secret'
      }
    })

    const response = await POST(request) as unknown as ApiResponse

    expect(response.status).toBe(401)
    expect(response.error).toBe('Unauthorized')
  })

  it('should return 401 with missing authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/cleanup', {
      method: 'POST'
    })

    const response = await POST(request) as unknown as ApiResponse

    expect(response.status).toBe(401)
    expect(response.error).toBe('Unauthorized')
  })

  it('should handle database errors gracefully', async () => {
    const mockFrom = mockSupabase.from as jest.Mock
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      delete: vi.fn().mockResolvedValueOnce({
        data: null,
        error: new Error('Database error')
      })
    })

    const request = new NextRequest('http://localhost:3000/api/auth/cleanup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLEANUP_SECRET_KEY}`
      }
    })

    const response = await POST(request) as unknown as ApiResponse

    expect(response.status).toBe(500)
    expect(response.error).toBe('Failed to clean up expired sessions')
  })

  it('should handle no expired sessions', async () => {
    const mockFrom = mockSupabase.from as jest.Mock
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      delete: vi.fn().mockResolvedValueOnce({
        data: [],
        error: null
      })
    })

    const request = new NextRequest('http://localhost:3000/api/auth/cleanup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLEANUP_SECRET_KEY}`
      }
    })

    const response = await POST(request) as unknown as ApiResponse

    expect(response.status).toBe(200)
    expect(response.message).toBe('No expired sessions to clean up')
  })
}) 