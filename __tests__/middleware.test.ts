import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { mockSupabaseClient, resetSupabaseMocks } from './helpers/supabase-mock'
import { middleware } from '@/middleware'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient)
}))

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetSupabaseMocks()
  })

  const createMockRequest = (url: string) => {
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      headers: new Headers({
        'cookie': 'some-cookie=value'
      })
    })
  }

  it('should allow access to public routes', async () => {
    const request = createMockRequest('/login')
    const response = await middleware(request)

    expect(response).toBeUndefined()
  })

  it('should redirect unauthenticated users to login', async () => {
    const request = createMockRequest('/dashboard')
    const getSessionMock = mockSupabaseClient.auth.getSession as unknown as { 
      mockResolvedValueOnce: (value: { data: { session: null }, error: null }) => void 
    }
    getSessionMock.mockResolvedValueOnce({ data: { session: null }, error: null })

    const response = await middleware(request)

    expect(response).toBeInstanceOf(NextResponse)
    expect(response?.headers.get('location')).toBe('/login')
  })

  it('should allow authenticated users to access protected routes', async () => {
    const request = createMockRequest('/dashboard')
    const getSessionMock = mockSupabaseClient.auth.getSession as unknown as { 
      mockResolvedValueOnce: (value: { 
        data: { session: { user: { id: string, email: string }, expires_at: number } }, 
        error: null 
      }) => void 
    }
    getSessionMock.mockResolvedValueOnce({
      data: {
        session: {
          user: { id: '123', email: 'test@example.com' },
          expires_at: Date.now() + 3600
        }
      },
      error: null
    })

    const response = await middleware(request)

    expect(response).toBeUndefined()
  })

  it('should redirect authenticated users away from auth routes', async () => {
    const request = createMockRequest('/login')
    const getSessionMock = mockSupabaseClient.auth.getSession as unknown as { 
      mockResolvedValueOnce: (value: { 
        data: { session: { user: { id: string, email: string }, expires_at: number } }, 
        error: null 
      }) => void 
    }
    getSessionMock.mockResolvedValueOnce({
      data: {
        session: {
          user: { id: '123', email: 'test@example.com' },
          expires_at: Date.now() + 3600
        }
      },
      error: null
    })

    const response = await middleware(request)

    expect(response).toBeInstanceOf(NextResponse)
    expect(response?.headers.get('location')).toBe('/dashboard')
  })

  it('should handle auth errors gracefully', async () => {
    const request = createMockRequest('/dashboard')
    const getSessionMock = mockSupabaseClient.auth.getSession as unknown as { 
      mockResolvedValueOnce: (value: { data: { session: null }, error: Error }) => void 
    }
    getSessionMock.mockResolvedValueOnce({
      data: { session: null },
      error: new Error('Auth error')
    })

    const response = await middleware(request)

    expect(response).toBeInstanceOf(NextResponse)
    expect(response?.headers.get('location')).toBe('/login')
  })

  it('should allow access to api routes', async () => {
    const request = createMockRequest('/api/some-endpoint')
    const response = await middleware(request)

    expect(response).toBeUndefined()
  })

  it('should set auth cookie in response', async () => {
    const request = createMockRequest('/dashboard')
    const getSessionMock = mockSupabaseClient.auth.getSession as unknown as { 
      mockResolvedValueOnce: (value: { 
        data: { session: { user: { id: string, email: string }, expires_at: number } }, 
        error: null 
      }) => void 
    }
    getSessionMock.mockResolvedValueOnce({
      data: {
        session: {
          user: { id: '123', email: 'test@example.com' },
          expires_at: Date.now() + 3600
        }
      },
      error: null
    })

    await middleware(request)

    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled()
  })

  it('should handle role-based access control', async () => {
    const request = createMockRequest('/admin')
    const getSessionMock = mockSupabaseClient.auth.getSession as unknown as { 
      mockResolvedValueOnce: (value: { 
        data: { session: { user: { id: string, email: string }, expires_at: number } }, 
        error: null 
      }) => void 
    }
    getSessionMock.mockResolvedValueOnce({
      data: {
        session: {
          user: { id: '123', email: 'test@example.com' },
          expires_at: Date.now() + 3600
        }
      },
      error: null
    })

    const selectMock = mockSupabaseClient.from('users').select as unknown as {
      mockResolvedValueOnce: (value: { data: Array<{ role: string }>, error: null }) => void
    }
    selectMock.mockResolvedValueOnce({
      data: [{ role: 'user' }],
      error: null
    })

    const response = await middleware(request)

    expect(response).toBeInstanceOf(NextResponse)
    expect(response?.headers.get('location')).toBe('/dashboard')
  })
}) 