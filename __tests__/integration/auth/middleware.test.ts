import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextResponse, NextRequest } from 'next/server'
import { middleware } from '@/middleware'
import { mockAuthSession } from '../../helpers/auth-mocks'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Create a mock Supabase client
const mockGetSession = vi.fn()
const mockSupabaseClient = {
  auth: {
    getSession: mockGetSession,
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
} as unknown as SupabaseClient<Database>

// Mock createServerClient
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient)
}))

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default mock behavior
    mockGetSession.mockReturnValue(Promise.resolve(mockAuthSession()))
  })

  test('allows access to public routes', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/login'))
    const response = await middleware(request)
    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(200)
  })

  test('redirects unauthenticated users from protected routes', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))
    const response = await middleware(request)
    expect(response?.headers.get('location')).toBe('/login')
    expect(response.status).toBe(302)
  })

  test('allows authenticated users to access protected routes', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockGetSession.mockReturnValueOnce(Promise.resolve(mockAuthSession(mockUser)))

    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))
    const response = await middleware(request)
    expect(response).toBeInstanceOf(NextResponse)
    expect(response?.headers.get('location')).toBeNull()
    expect(response.status).toBe(200)
  })

  test('handles auth errors gracefully', async () => {
    mockGetSession.mockReturnValueOnce(Promise.reject(new Error('Auth error')))

    const request = new NextRequest(new URL('http://localhost:3000/dashboard'))
    const response = await middleware(request)
    expect(response?.headers.get('location')).toBe('/login')
  })

  test('preserves query parameters when redirecting', async () => {
    const request = new NextRequest(new URL('http://localhost:3000/dashboard?foo=bar'))
    const response = await middleware(request)
    expect(response?.headers.get('location')).toBe('/login?foo=bar')
  })
}) 