import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

// Mock data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'Test',
    last_name: 'User',
    role: 'dispatcher'
  }
}

export const mockSession = {
  user: mockUser,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600
}

// Create mock Supabase client
export function createMockSupabaseClient() {
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((callback) => callback({ data: [], error: null }))
  })

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockImplementation((callback) => {
        callback('SIGNED_IN', mockSession)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })
    },
    from: mockFrom,
    rpc: vi.fn()
  } as unknown as SupabaseClient<Database>
}

// Mock both client and server Supabase instances
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn().mockImplementation(createMockSupabaseClient)
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(createMockSupabaseClient)
}))

// New modern mocks for @supabase/ssr
export function createMockServerClient() {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      refreshSession: vi.fn(),
      setSession: vi.fn(),
    },
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  }
}

export function createMockServerComponentClient() {
  return {
    ...createMockServerClient(),
    headers: new Headers(),
    cookies: new Map(),
  }
}

export function createMockServerActionClient() {
  return {
    ...createMockServerClient(),
    action: vi.fn(),
  }
}

// Mock for real-time subscriptions
export function createMockRealtimeClient() {
  const channels = new Map()
  
  return {
    channel: vi.fn((name) => {
      if (!channels.has(name)) {
        channels.set(name, {
          on: vi.fn(),
          subscribe: vi.fn(),
          unsubscribe: vi.fn(),
        })
      }
      return channels.get(name)
    }),
    removeChannel: vi.fn((name) => {
      channels.delete(name)
    }),
    removeAllChannels: vi.fn(() => {
      channels.clear()
    }),
  }
} 