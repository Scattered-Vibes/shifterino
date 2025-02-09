import { type SupabaseClient, type UserAttributes, type RealtimeChannel, type RealtimeClient } from '@supabase/supabase-js'
import { vi, type Mock } from 'vitest'
import type { User, UserResponse } from '@supabase/supabase-js'

export interface MockData {
  [key: string]: unknown
}

type MockResponse<T> = { data: T | null; error: Error | null }
type Database = Record<string, unknown>

export interface MockQueryBuilder<T = unknown> {
  select: Mock & ((columns?: string) => MockQueryBuilder<T>)
  insert: Mock & ((data: Partial<T> | Partial<T>[]) => MockQueryBuilder<T>)
  update: Mock & ((data: Partial<T>) => MockQueryBuilder<T>)
  delete: Mock & (() => MockQueryBuilder<T>)
  eq: Mock & ((column: string, value: unknown) => MockQueryBuilder<T>)
  neq: Mock & ((column: string, value: unknown) => MockQueryBuilder<T>)
  gt: Mock & ((column: string, value: number) => MockQueryBuilder<T>)
  lt: Mock & ((column: string, value: number) => MockQueryBuilder<T>)
  gte: Mock & ((column: string, value: number) => MockQueryBuilder<T>)
  lte: Mock & ((column: string, value: number) => MockQueryBuilder<T>)
  in: Mock & ((column: string, values: unknown[]) => MockQueryBuilder<T>)
  is: Mock & ((column: string, value: boolean | null) => MockQueryBuilder<T>)
  contains: Mock & ((column: string, value: unknown) => MockQueryBuilder<T>)
  single: Mock & (() => Promise<MockResponse<T>>)
  maybeSingle: Mock & (() => Promise<MockResponse<T>>)
  order: Mock & ((column: string, options?: { ascending?: boolean }) => MockQueryBuilder<T>)
  limit: Mock & ((count: number) => MockQueryBuilder<T>)
  then: <TResult>(
    onfulfilled?: ((value: MockResponse<T>) => TResult | PromiseLike<TResult>) | null | undefined
  ) => Promise<TResult>
  getCalls: () => { method: string; args: unknown[] }[]
}

type MockAuthMethods = {
  getUser: Mock<[], Promise<{ data: { user: User | null }; error: Error | null }>>
  updateUser: Mock<[UserAttributes], Promise<UserResponse>>
  signInWithPassword: Mock<[{ email: string; password: string }], Promise<UserResponse>>
  signOut: Mock<[], Promise<{ error: Error | null }>>
  onAuthStateChange: Mock<
    [(payload: { event: string; session: unknown }) => void],
    { data: { subscription: { unsubscribe: () => void } }; error: null }
  >
}

interface MockStorageApi {
  upload: Mock<[unknown], Promise<{ data: unknown; error: Error | null }>>
  download: Mock<[], Promise<{ data: unknown; error: Error | null }>>
  remove: Mock<[], Promise<{ data: unknown; error: Error | null }>>
  list: Mock<[], Promise<{ data: unknown[]; error: Error | null }>>
}

interface MockRealtimeClient extends Partial<RealtimeClient> {
  connect: () => void
  disconnect: () => void
  _workerObjectUrl: string
  accessTokenValue: string | null
  apiKey: string | null
  channels: RealtimeChannel[]
  endPoint: string
}

interface MockMethods {
  getLastTableName: () => string
  getLastChannelName: () => string
  mockSuccess: <T>(data: T) => void
  mockError: (error: Error) => void
  triggerSubscription: (event: string, payload: unknown) => void
}

type BaseSupabaseClient = Omit<SupabaseClient<Database>, 'from' | 'auth' | 'channel'>

export interface MockSupabaseClient extends Omit<BaseSupabaseClient, 'removeChannel' | 'removeAllChannels'>, MockMethods {
  from: <T>(table: string) => MockQueryBuilder<T>
  auth: MockAuthMethods
  channel: Mock<[string], RealtimeChannel>
  schema: string
  supabaseUrl: string
  supabaseKey: string
  realtimeUrl: string
  authUrl: string
  storageUrl: string
  functionsUrl: string
  realtime: MockRealtimeClient
  storage: {
    from: (bucket: string) => MockStorageApi
  }
  functions: {
    invoke: Mock<[string, unknown?], Promise<{ data: unknown; error: Error | null }>>
  }
  getChannels: () => RealtimeChannel[]
  removeChannel: Mock<[RealtimeChannel], Promise<'ok' | 'timed out' | 'error'>>
  removeAllChannels: Mock<[], Promise<('ok' | 'timed out' | 'error')[]>>
}

export function createMockSupabaseClient(): MockSupabaseClient {
  let lastTableName = ''
  let lastChannelName = ''
  let mockResponse: MockResponse<unknown> = { data: null, error: null }
  const subscriptions = new Map<string, ((payload: unknown) => void)[]>()
  const queryHistory: { method: string; args: unknown[] }[] = []

  const mockAuth: MockAuthMethods = {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockImplementation((_callback) => {
      const subscription = { unsubscribe: vi.fn() }
      return { data: { subscription }, error: null }
    })
  }

  const createQueryBuilder = <T>(): MockQueryBuilder<T> => {
    queryHistory.length = 0
    
    const builder: MockQueryBuilder<T> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(mockResponse as MockResponse<T>)),
      maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(mockResponse as MockResponse<T>)),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: <TResult>(
        onfulfilled?: ((value: MockResponse<T>) => TResult | PromiseLike<TResult>) | null | undefined
      ): Promise<TResult> => {
        const response = mockResponse as MockResponse<T>
        if (!onfulfilled) {
          return Promise.resolve(response) as Promise<TResult>
        }
        return Promise.resolve(response).then(onfulfilled)
      },
      getCalls: () => [...queryHistory]
    }

    return Object.assign(builder, {
      ...Object.fromEntries(
        Object.entries(builder).map(([key, method]) => [
          key,
          typeof method === 'function' && key !== 'then' && key !== 'getCalls'
            ? vi.fn((...args: unknown[]) => {
                queryHistory.push({ method: key, args })
                return method.apply(builder, args)
              })
            : method
        ])
      )
    }) as MockQueryBuilder<T>
  }

  const mockClient: MockSupabaseClient = {
    supabaseUrl: 'http://localhost:54321',
    supabaseKey: 'mock-key',
    realtimeUrl: 'ws://localhost:54321/realtime/v1',
    authUrl: 'http://localhost:54321/auth/v1',
    storageUrl: 'http://localhost:54321/storage/v1',
    functionsUrl: 'http://localhost:54321/functions/v1',
    schema: 'public',
    realtime: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      _workerObjectUrl: 'blob:null',
      accessTokenValue: null,
      apiKey: null,
      channels: [],
      endPoint: 'ws://localhost:54321/realtime/v1'
    },
    auth: mockAuth,
    from: <T>(table: string) => {
      lastTableName = table
      return createQueryBuilder<T>()
    },
    storage: {
      from: (_bucket: string) => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null })
      })
    },
    channel: vi.fn().mockImplementation((_name: string) => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue(null)
    })) as Mock<[string], RealtimeChannel>,
    rpc: vi.fn().mockImplementation((_fn: string) => ({
      select: vi.fn().mockResolvedValue({ data: null, error: null })
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null })
    },
    getChannels: vi.fn().mockReturnValue([]),
    removeChannel: vi.fn().mockResolvedValue('ok'),
    removeAllChannels: vi.fn().mockResolvedValue(['ok']),
    getLastTableName: () => lastTableName,
    getLastChannelName: () => lastChannelName,
    mockSuccess: <T>(data: T) => {
      mockResponse = { data, error: null }
    },
    mockError: (error: Error) => {
      mockResponse = { data: null, error }
    },
    triggerSubscription: (event: string, payload: unknown) => {
      const handlers = subscriptions.get(event) || []
      handlers.forEach((handler) => handler(payload))
    }
  }

  return mockClient
}

// Helper functions for tests
export function mockSuccess<T>(data: T) {
  return { data, error: null }
}

export function mockError(message: string) {
  return { data: null, error: new Error(message) }
}

// Helper to create a mock user
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: {},
    ...overrides
  }
}