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

// Base query builder mock implementation
const createQueryBuilderMock = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  overlaps: vi.fn().mockReturnThis(),
  then: vi.fn().mockImplementation((callback) => callback({ data: [], error: null })),
})

// Mock for createServerClient (used in server components/actions)
export function createMockServerClient() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn()
    },
    from: vi.fn().mockImplementation((_table) => createQueryBuilderMock()),
    rpc: vi.fn()
  } as unknown as SupabaseClient<Database>
}

// Mock for createClient (used in client components)
export function createMockClient() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockImplementation((_callback) => {
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })
    },
    from: vi.fn().mockImplementation((_table) => createQueryBuilderMock()),
    rpc: vi.fn()
  } as unknown as SupabaseClient<Database>
}

// Mock for real-time subscriptions
export function createMockRealtimeChannel() {
  const channels = new Map()

  return {
    channel: vi.fn((name) => {
      if (!channels.has(name)) {
        channels.set(name, {
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockResolvedValue('ok'),
          unsubscribe: vi.fn().mockResolvedValue('ok'),
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

// Mock implementations for Supabase modules
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(createMockServerClient)
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn().mockImplementation(createMockClient)
}))

// New modern mocks for @supabase/ssr
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