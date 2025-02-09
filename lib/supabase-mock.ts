import { createClient } from '@supabase/supabase-js'
import { vi } from 'vitest'

export interface MockData {
  [key: string]: unknown
}

export interface MockSupabaseClient {
  _mock: {
    mockSuccess: (data: MockData) => void
    mockError: (error: Error) => void
    triggerSubscription: (event: string, payload: MockData) => void
  }
  from: (table: string) => {
    select: () => Promise<{ data: MockData | null; error: Error | null }>
    insert: () => Promise<{ data: MockData | null; error: Error | null }>
    update: () => Promise<{ data: MockData | null; error: Error | null }>
    delete: () => Promise<{ data: MockData | null; error: Error | null }>
    on: (event: string, handler: (payload: MockData) => void) => {
      unsubscribe: () => void
    }
  }
}

export function createMockSupabaseClient(): MockSupabaseClient {
  const mockFn = vi.fn()
  const subscriptions = new Map<string, ((payload: MockData) => void)[]>()

  const client = createClient('http://localhost:54321', 'mock-key')

  const mockClient = {
    ...client,
    _mock: {
      mockSuccess: (data: MockData) => mockFn.mockResolvedValue({ data, error: null }),
      mockError: (error: Error) => mockFn.mockRejectedValue({ data: null, error }),
      triggerSubscription: (event: string, payload: MockData) => {
        const handlers = subscriptions.get(event) || []
        handlers.forEach((handler) => handler(payload))
      }
    },
    from: () => ({
      select: () => Promise.resolve({ data: mockFn(), error: null }),
      insert: () => Promise.resolve({ data: mockFn(), error: null }),
      update: () => Promise.resolve({ data: mockFn(), error: null }),
      delete: () => Promise.resolve({ data: mockFn(), error: null }),
      on: (event: string, handler: (payload: MockData) => void) => {
        const handlers = subscriptions.get(event) || []
        subscriptions.set(event, [...handlers, handler])
        return { unsubscribe: () => {} }
      }
    })
  }

  return mockClient as unknown as MockSupabaseClient
} 