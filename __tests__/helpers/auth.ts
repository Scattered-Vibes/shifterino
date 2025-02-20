import { vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'user',
  created_at: new Date().toISOString()
}

// Mock session data
export const mockSession = {
  access_token: 'test-token',
  refresh_token: 'test-refresh-token',
  expires_at: Date.now() + 3600000,
  user: mockUser
}

// Mock error type
interface AuthError {
  message: string
  status?: number
}

// Mock Supabase responses
export const mockSupabaseResponses = {
  success: {
    user: {
      data: { user: mockUser },
      error: null
    },
    session: {
      data: { session: mockSession },
      error: null
    },
    login: {
      data: { user: mockUser, session: mockSession },
      error: null
    }
  },
  error: {
    auth: {
      data: { user: null, session: null },
      error: { message: 'Invalid credentials', status: 401 }
    }
  }
}

interface AuthMockOptions {
  authenticated?: boolean
  error?: AuthError | null
}

// Auth setup helper
export const mockSupabaseAuth = () => ({
  auth: {
    signInWithPassword: vi.fn().mockImplementation(({ email, password }) => {
      if (email === 'test@example.com' && password === 'password123') {
        return Promise.resolve({
          data: {
            user: mockUser,
            session: mockSession
          },
          error: null
        })
      }
      return Promise.resolve({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })
    }),
    getUser: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        data: { user: mockUser },
        error: null
      })
    }),
    getSession: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        data: { session: mockSession },
        error: null
      })
    }),
    signOut: vi.fn().mockImplementation(() => {
      return Promise.resolve({ error: null })
    })
  }
})

export const setupAuthMocks = ({ authenticated = false, error = null }: AuthMockOptions = {}) => {
  const mockSupabase = mockSupabaseAuth()
  
  if (error) {
    mockSupabase.auth.signInWithPassword.mockRejectedValue(error)
    mockSupabase.auth.getUser.mockRejectedValue(error)
    mockSupabase.auth.getSession.mockRejectedValue(error)
    return mockSupabase
  }

  if (!authenticated) {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })
  }

  return mockSupabase
}

// Mock Next.js router
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn()
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  redirect: (path: string) => {
    const response = new Response(null, {
      status: 307,
      headers: { Location: path }
    })
    return response
  },
  revalidatePath: (path: string) => {
    // Implementation of revalidatePath
  }
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}))

// Mock cookies store
export const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn()
}

// Helper to simulate form submission
export function createFormData(data: Record<string, string>) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

// Helper to wait for state updates
export async function waitForStateUpdate() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Test utilities for auth components
export const mockRedirect = vi.fn()
export const mockRevalidatePath = vi.fn() 