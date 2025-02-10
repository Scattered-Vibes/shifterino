import { POST } from '@/app/api/auth/login/route'
import { createMockSupabaseClient, createMockUser } from '@/test/helpers/supabase-mock'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock response types
interface SuccessResponse {
  status: number;
  redirectTo: string;
}

interface ErrorResponse {
  status: number;
  error: string;
}

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      ...data,
      status: init?.status || 200
    })),
    redirect: vi.fn((url) => ({
      status: 200,
      redirectTo: url
    }))
  },
  NextRequest: vi.fn()
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => createMockSupabaseClient())
}))

describe('POST /api/auth/login', () => {
  let mockSupabase = createMockSupabaseClient()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
  })

  it('should return 200 and redirect on successful login', async () => {
    const mockUser = createMockUser()
    const mockEmployee = {
      id: 'emp-1',
      role: 'dispatcher',
      auth_id: mockUser.id
    }

    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: mockUser,
        session: { access_token: 'test-token', refresh_token: 'test-refresh' }
      },
      error: null
    })

    const mockFrom = mockSupabase.from as jest.Mock
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: mockEmployee,
        error: null
      })
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    const response = await POST(request) as unknown as SuccessResponse

    expect(response.status).toBe(200)
    expect(response.redirectTo).toBe('/overview')
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should return 400 on invalid credentials', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials', status: 400 }
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    })

    const response = await POST(request) as unknown as ErrorResponse

    expect(response.status).toBe(400)
    expect(response.error).toBe('Invalid credentials')
  })

  it('should return 400 if employee data not found', async () => {
    const mockUser = createMockUser()

    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: mockUser,
        session: { access_token: 'test-token', refresh_token: 'test-refresh' }
      },
      error: null
    })

    const mockFrom = mockSupabase.from as jest.Mock
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'Employee not found' }
      })
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    const response = await POST(request) as unknown as ErrorResponse

    expect(response.status).toBe(400)
    expect(response.error).toBe('Employee not found')
  })

  it('should return 400 on invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: ''
      })
    })

    const response = await POST(request) as unknown as ErrorResponse

    expect(response.status).toBe(400)
    expect(response.error).toBe('Invalid request body')
  })

  it('should return 500 on unexpected errors', async () => {
    mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(
      new Error('Unexpected error')
    )

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    const response = await POST(request) as unknown as ErrorResponse

    expect(response.status).toBe(500)
    expect(response.error).toBe('Internal server error')
  })
}) 