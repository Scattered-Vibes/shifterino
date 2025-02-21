import { render, screen, waitFor } from '@testing-library/react'
import { Providers } from '../providers'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Supabase client
const mockUnsubscribe = vi.fn()
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi.fn(() => ({ data: null, error: null, unsubscribe: mockUnsubscribe }))
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(() => ({ unsubscribe: mockUnsubscribe }))
  }))
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

describe('Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children', async () => {
    render(
      <Providers>
        <div data-testid="test-child">Test Content</div>
      </Providers>
    )

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
  })

  it('starts with loading state', () => {
    render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    )

    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
  })

  it('removes loading state after initialization', async () => {
    render(
      <Providers>
        <div data-testid="test-child">Test Content</div>
      </Providers>
    )

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument()
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })
  })

  it('sets up auth subscription', async () => {
    render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    )

    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
  })

  it('sets up realtime subscription', async () => {
    render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    )

    expect(mockSupabase.channel).toHaveBeenCalled()
  })

  it('cleans up subscriptions on unmount', () => {
    const { unmount } = render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    )

    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('handles auth state changes', async () => {
    const mockUser = { id: '1', email: 'test@example.com' }
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })

    render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    )

    await waitFor(() => {
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })
  })

  it('handles realtime events', async () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: mockUnsubscribe })
    }
    mockSupabase.channel.mockReturnValueOnce(mockChannel)

    render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    )

    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })
}) 