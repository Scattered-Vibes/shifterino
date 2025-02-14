import { vi } from 'vitest'
import type { SupabaseClient, User, RealtimeChannel, AuthError } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

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

type MockData = Record<string, unknown>
type MockHandler = (payload: MockData) => void

interface MockQueryBuilder {
  select: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  eq: jest.Mock
  neq: jest.Mock
  gt: jest.Mock
  gte: jest.Mock
  lt: jest.Mock
  lte: jest.Mock
  in: jest.Mock
  is: jest.Mock
  or: jest.Mock
  single: jest.Mock
  order: jest.Mock
  range: jest.Mock
  overlaps: jest.Mock
  then: jest.Mock
  mockReturnValueOnce: (value: unknown) => MockQueryBuilder
  mockResolvedValueOnce: (value: unknown) => MockQueryBuilder
  url?: string
  headers?: Record<string, string>
  upsert?: (value: unknown) => MockQueryBuilder
}

export interface MockSupabaseClient extends Omit<SupabaseClient<Database>, 'from'> {
  _mock: {
    mockSuccess: (data: MockData) => void
    mockError: (error: Error) => void
    triggerSubscription: (event: string, payload: MockData) => void
    getLastTableName: () => string
    getCalls: () => unknown[]
  }
  from: jest.Mock<MockQueryBuilder>
}

// Base query builder mock implementation
const createQueryBuilderMock = (): MockQueryBuilder => {
  const mock = {
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
    mockReturnValueOnce: function(value: unknown) {
      this.then.mockImplementationOnce((callback) => callback(value))
      return this
    },
    mockResolvedValueOnce: function(value: unknown) {
      this.then.mockImplementationOnce((callback) => callback(value))
      return this
    },
    url: 'mock-url',
    headers: {},
    upsert: vi.fn().mockReturnThis()
  }
  return mock as unknown as MockQueryBuilder
}

export function createMockSupabaseClient() {
  const mockFn = vi.fn()
  const subscriptions = new Map<string, MockHandler[]>()
  const queryBuilder = createQueryBuilderMock()
  let lastTableName = ''

  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) as unknown as MockSupabaseClient['auth']['getUser'],
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }) as unknown as MockSupabaseClient['auth']['getSession'],
      signOut: vi.fn().mockResolvedValue({ error: null }) as unknown as MockSupabaseClient['auth']['signOut'],
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } as unknown as RealtimeChannel },
        error: null
      })) as unknown as MockSupabaseClient['auth']['onAuthStateChange']
    },
    from: vi.fn((table: string) => {
      lastTableName = table
      return queryBuilder
    }),
    _mock: {
      mockSuccess: (data: MockData) => mockFn.mockResolvedValue({ data, error: null }),
      mockError: (error: Error) => mockFn.mockRejectedValue({ data: null, error }),
      triggerSubscription: (event: string, payload: MockData) => {
        const handlers = subscriptions.get(event) || []
        handlers.forEach(handler => handler(payload))
      },
      getLastTableName: () => lastTableName,
      getCalls: () => queryBuilder.then.mock.calls
    }
  }

  return mockClient as unknown as MockSupabaseClient
}

// Helper to create a mock user with custom data
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    ...mockUser,
    app_metadata: {},
    user_metadata: mockUser.user_metadata,
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides
  }
}

// Mock for createServerClient (used in server components/actions)
export function createMockServerClient() {
  const client = createMockSupabaseClient()
  return {
    ...client,
    auth: {
      ...client.auth,
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) as unknown as MockSupabaseClient['auth']['getUser'],
      signOut: vi.fn().mockResolvedValue({ error: null }) as unknown as MockSupabaseClient['auth']['signOut']
    }
  } as unknown as MockSupabaseClient
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
  const client = createMockSupabaseClient()
  return {
    ...client,
    auth: {
      ...client.auth,
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) as unknown as MockSupabaseClient['auth']['getUser']
    }
  } as unknown as MockSupabaseClient
}

export function createMockServerActionClient() {
  const client = createMockSupabaseClient()
  return {
    ...client,
    auth: {
      ...client.auth,
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) as unknown as MockSupabaseClient['auth']['getUser']
    }
  } as unknown as MockSupabaseClient
}

// Mock for realtime client
export function createMockRealtimeClient() {
  const client = createMockSupabaseClient()
  const subscriptions = new Map<string, MockHandler[]>()
  
  return {
    ...client,
    channel: (_name: string) => ({
      on: (event: string, callback: MockHandler) => {
        const handlers = subscriptions.get(event) || []
        subscriptions.set(event, [...handlers, callback])
        return {
          subscribe: vi.fn().mockResolvedValue({ data: { subscription: { unsubscribe: vi.fn() } }, error: null }),
          unsubscribe: vi.fn()
        }
      }
    }),
    _mock: {
      ...client._mock,
      triggerRealtimeEvent: (event: string, payload: MockData) => {
        const handlers = subscriptions.get(event) || []
        handlers.forEach(handler => handler(payload))
      }
    }
  } as unknown as MockSupabaseClient
}

type MockResponse<T> = {
  data: T | null
  error: Error | null
}

export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        mockResolvedValueOnce: vi.fn(),
      })),
      mockResolvedValueOnce: vi.fn(),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(),
      mockResolvedValueOnce: vi.fn(),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        mockResolvedValueOnce: vi.fn(),
      })),
      mockResolvedValueOnce: vi.fn(),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        mockResolvedValueOnce: vi.fn(),
      })),
    })),
    mockResolvedValueOnce: vi.fn(),
  })),
} as unknown as jest.Mocked<SupabaseClient<Database>>

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient.auth).forEach(mock => {
    if (typeof mock === 'function') {
      (mock as jest.Mock).mockReset()
    }
  })
  ;(mockSupabaseClient.from as jest.Mock).mockReset()
}

// Helper to setup auth session
export const mockAuthSession = (user: Partial<User> | null = null, error: AuthError | null = null) => {
  mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
    data: { 
      session: user ? { 
        user: user as User,
        expires_at: Date.now() + 3600,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token'
      } : null 
    },
    error,
  })
}

// Helper to setup database query responses
export const mockDbResponse = <T>(
  table: keyof Database['public']['Tables'], 
  data: T | null = null, 
  error: Error | null = null
) => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValueOnce({ data, error } as MockResponse<T>),
  }
  ;(mockSupabaseClient.from as jest.Mock).mockReturnValueOnce(mockChain)
  return mockChain
} 