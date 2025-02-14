import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider'
import { mockSupabaseClient, mockAuthSession, resetSupabaseMocks } from '../../helpers/supabase-mock'
import { AuthError } from '@supabase/supabase-js'

vi.mock('@/lib/supabase/client', () => ({
  getClient: vi.fn(() => mockSupabaseClient)
}))

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, signOut } = useAuth()
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user?.email || 'no user'}</div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetSupabaseMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should show loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('true')
  })

  it('should handle no session state', async () => {
    mockAuthSession(null)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('no user')
  })

  it('should handle authenticated state', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    mockAuthSession(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
  })

  it('should handle sign out', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    mockAuthSession(mockUser)

    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    const signOutMock = mockSupabaseClient.auth.signOut as unknown as { 
      mockResolvedValueOnce: (value: { error: null }) => void 
    }
    signOutMock.mockResolvedValueOnce({ error: null })

    await act(async () => {
      getByText('Sign Out').click()
    })

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    expect(screen.getByTestId('user')).toHaveTextContent('no user')
  })

  it('should handle auth state changes', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com'
    }
    mockAuthSession(mockUser)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled()

    const onAuthStateChangeMock = mockSupabaseClient.auth.onAuthStateChange as unknown as {
      mock: { calls: [unknown, (event: string, session: null) => void][] }
    }
    const authChangeCallback = onAuthStateChangeMock.mock.calls[0][1]
    
    await act(async () => {
      authChangeCallback('SIGNED_OUT', null)
    })

    expect(screen.getByTestId('user')).toHaveTextContent('no user')
  })

  it('should handle auth errors gracefully', async () => {
    const authError = new AuthError('Auth error', 400)
    
    mockAuthSession(null, authError)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('no user')
  })
}) 