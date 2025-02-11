import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import { vi } from 'vitest'

type MockData = Record<string, unknown>
type MockHandler = (payload: MockData) => void

export interface MockSupabaseClient extends SupabaseClient {
  _mock: {
    mockSuccess: (data: MockData) => void
    mockError: (error: Error) => void
    triggerSubscription: (event: string, payload: MockData) => void
  }
}

export function createMockSupabaseClient() {
  const mockFn = vi.fn()
  const subscriptions = new Map<string, MockHandler[]>()

  const client = createClient('http://localhost:54321', 'mock-key')

  const mockClient = {
    ...client,
    _mock: {
      mockSuccess: (data: MockData) => mockFn.mockResolvedValue({ data, error: null }),
      mockError: (error: Error) => mockFn.mockRejectedValue({ data: null, error }),
      triggerSubscription: (event: string, payload: MockData) => {
        const handlers = subscriptions.get(event) || []
        handlers.forEach((handler: MockHandler) => handler(payload))
      }
    },
    from: () => ({
      select: () => ({ data: mockFn(), error: null }),
      insert: () => ({ data: mockFn(), error: null }),
      update: () => ({ data: mockFn(), error: null }),
      delete: () => ({ data: mockFn(), error: null }),
      on: (event: string, handler: MockHandler) => {
        const handlers = subscriptions.get(event) || []
        subscriptions.set(event, [...handlers, handler])
        return { unsubscribe: () => {} }
      }
    })
  }

  return mockClient as MockSupabaseClient
}