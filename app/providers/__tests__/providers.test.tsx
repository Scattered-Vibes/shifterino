import { render, screen, act, waitFor } from '@testing-library/react'
import { Providers, useSupabase } from '../providers'
import { createBrowserClient } from '@supabase/ssr'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}))

// Mock Supabase client
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
}))

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

const mockEmployee = {
  id: 'test-employee-id',
  auth_id: 'test-user-id',
  first_name: 'Test',
  last_name: 'User',
  role: 'dispatcher' as const,
  email: 'test@example.com',
  shift_pattern: '4x10' as const,
}

// Test component to access context
function TestComponent() {
  const { user, employee, isLoading, isSigningOut } = useSupabase()
  return (
    <div>
      <div data-testid="loading-state">{isLoading.toString()}</div>
      <div data-testid="signing-out-state">{isSigningOut.toString()}</div>
      <div data-testid="user-email">{user?.email || 'no user'}</div>
      <div data-testid="employee-name">
        {employee ? `${employee.first_name} ${employee.last_name}` : 'no employee'}
      </div>
    </div>
  )
}

describe('Providers', () => {
  let mockSupabase: any
  let mockRouter: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signOut: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    }

    ;(createBrowserClient as any).mockReturnValue(mockSupabase)
    mockRouter = useRouter()
  })

  it('should start with loading state true', () => {
    render(
      <Providers>
        <TestComponent />
      </Providers>
    )

    expect(screen.getByTestId('loading-state').textContent).toBe('true')
  })

  it('should handle successful auth and employee data fetch', async () => {
    // Mock successful auth
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
    })

    // Mock successful employee fetch
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockEmployee,
      error: null,
    })

    render(
      <Providers>
        <TestComponent />
      </Providers>
    )

    // Initially loading
    expect(screen.getByTestId('loading-state').textContent).toBe('true')

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('false')
    })

    // Verify user and employee data
    expect(screen.getByTestId('user-email').textContent).toBe(mockUser.email)
    expect(screen.getByTestId('employee-name').textContent).toBe(
      `${mockEmployee.first_name} ${mockEmployee.last_name}`
    )
  })

  it('should handle auth but no employee data', async () => {
    // Mock successful auth
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
    })

    // Mock no employee found
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: null,
    })

    render(
      <Providers>
        <TestComponent />
      </Providers>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('false')
    })

    expect(screen.getByTestId('user-email').textContent).toBe(mockUser.email)
    expect(screen.getByTestId('employee-name').textContent).toBe('no employee')
  })

  it('should handle sign out process', async () => {
    // Mock successful auth initially
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockEmployee,
      error: null,
    })

    // Mock successful sign out
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    const { container } = render(
      <Providers>
        <TestComponent />
      </Providers>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('false')
    })

    // Get context
    const { signOut } = useSupabase()

    // Trigger sign out
    await act(async () => {
      await signOut()
    })

    // Verify router calls
    expect(mockRouter.refresh).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('should handle auth error gracefully', async () => {
    // Mock auth error
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Auth error'),
    })

    render(
      <Providers>
        <TestComponent />
      </Providers>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('false')
    })

    expect(screen.getByTestId('user-email').textContent).toBe('no user')
    expect(screen.getByTestId('employee-name').textContent).toBe('no employee')
  })

  it('should handle employee fetch error gracefully', async () => {
    // Mock successful auth
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
    })

    // Mock employee fetch error
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: new Error('Employee fetch error'),
    })

    render(
      <Providers>
        <TestComponent />
      </Providers>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('false')
    })

    expect(screen.getByTestId('user-email').textContent).toBe(mockUser.email)
    expect(screen.getByTestId('employee-name').textContent).toBe('no employee')
  })

  it('should cleanup on unmount', () => {
    const unsubscribe = vi.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    })

    const { unmount } = render(
      <Providers>
        <TestComponent />
      </Providers>
    )

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
}) 