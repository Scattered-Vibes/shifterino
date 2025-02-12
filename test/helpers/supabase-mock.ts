import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

// Mock data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {
    provider: 'email'
  }
}

export const mockSession = {
  user: mockUser,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600
}

// Create mock Supabase client
export function createMockSupabaseClient() {
  const mockClient = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null
      }),
      onAuthStateChange: vi.fn().mockImplementation((callback) => {
        callback('SIGNED_IN', mockSession)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
    })
  }

  return mockClient as unknown as SupabaseClient<Database>
}

export function mockAuthError(message: string) {
  const mockClient = createMockSupabaseClient()
  
  vi.mocked(mockClient.auth.getSession).mockResolvedValue({
    data: { session: null },
    error: {
      message,
      status: 400
    }
  })

  vi.mocked(mockClient.auth.getUser).mockResolvedValue({
    data: { user: null },
    error: {
      message,
      status: 400
    }
  })

  return mockClient
}

export function mockUnauthenticated() {
  const mockClient = createMockSupabaseClient()
  
  vi.mocked(mockClient.auth.getSession).mockResolvedValue({
    data: { session: null },
    error: null
  })

  vi.mocked(mockClient.auth.getUser).mockResolvedValue({
    data: { user: null },
    error: null
  })

  return mockClient
}

export function createMockServerClient() {
  return {
    ...createMockSupabaseClient(),
    auth: {
      ...createMockSupabaseClient().auth,
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null })
    }
  } as unknown as SupabaseClient<Database>
}

export function createMockServerComponentClient() {
  return createMockServerClient()
}

export function createMockServerActionClient() {
  return createMockServerClient()
}

export function createMockRealtimeClient() {
  return {
    ...createMockSupabaseClient(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    })
  } as unknown as SupabaseClient<Database>
} 