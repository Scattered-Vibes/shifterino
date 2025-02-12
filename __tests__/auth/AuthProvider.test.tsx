import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, Subscription, AuthChangeEvent } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/auth/client'

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
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
  })),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Test component that uses the auth context
function TestComponent() {
  const { user, role, isLoading } = useAuth()
  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="user">{user?.email || 'no user'}</div>
      <div data-testid="role">{role || 'no role'}</div>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    const mockSupabase = createClient()
    vi.mocked(mockSupabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    expect(screen.getByTestId('user')).toHaveTextContent('no user')
    expect(screen.getByTestId('role')).toHaveTextContent('no role')
  })

  it('should update state when session is available', async () => {
    const mockUser: User = {
      id: '123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    }
    const mockSupabase = createClient()
    
    vi.mocked(mockSupabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: mockUser } as Session },
      error: null,
    })

    const mockEmployeeData = {
      data: { role: 'dispatcher' as UserRole },
    }

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(mockEmployeeData),
        }),
      }),
    })

    vi.mocked(mockSupabase).from = mockFrom

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email!)
    expect(screen.getByTestId('role')).toHaveTextContent('dispatcher')
  })

  it('should handle sign out', async () => {
    const mockSupabase = createClient()
    const TestSignOut = () => {
      const { signOut } = useAuth()
      return <button onClick={() => signOut()}>Sign Out</button>
    }

    render(
      <AuthProvider>
        <TestSignOut />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByText('Sign Out').click()
    })

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('should handle auth state changes', async () => {
    const mockUser: User = {
      id: '123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    }
    const mockSupabase = createClient()
    
    vi.mocked(mockSupabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    })

    let authChangeCallback: (event: AuthChangeEvent, session: Session | null) => void = () => {}
    vi.mocked(mockSupabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authChangeCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
            id: 'test-sub',
            callback: vi.fn(),
          } as unknown as Subscription,
        },
      }
    })

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    expect(screen.getByTestId('user')).toHaveTextContent('no user')

    await act(async () => {
      authChangeCallback('SIGNED_IN', { user: mockUser } as Session)
    })

    expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email!)
  })
})