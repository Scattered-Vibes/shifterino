import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserAuthForm } from '@/app/(auth)/components/user-auth-form'
import { setupAuthMocks, mockRouter, mockUser, mockSession } from '../../helpers/auth'
import { cookies } from 'next/headers'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }))
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}))

describe('Login Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completes successful login flow', async () => {
    const mockSupabase = setupAuthMocks({ authenticated: true })
    const user = userEvent.setup()

    render(<UserAuthForm />)

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Verify Supabase call
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Verify cookies were set
    const cookieStore = cookies()
    expect(cookieStore.set).toHaveBeenCalledWith({
      name: 'sb-access-token',
      value: mockSession.access_token,
      httpOnly: true,
      secure: expect.any(Boolean),
      sameSite: 'lax',
      path: '/'
    })

    // Verify redirect
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/overview')
    })
  })

  it('handles login failure', async () => {
    setupAuthMocks({ authenticated: false })
    const user = userEvent.setup()

    render(<UserAuthForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })

    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('handles network error', async () => {
    const mockSupabase = setupAuthMocks({ 
      authenticated: false,
      error: { message: 'Network error', status: 503 }
    })
    const user = userEvent.setup()

    render(<UserAuthForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('validates required fields before submission', async () => {
    const user = userEvent.setup()
    const mockSupabase = setupAuthMocks({ authenticated: false })

    render(<UserAuthForm />)

    // Try to submit without filling fields
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/email/i)).toBeInvalid()
    expect(screen.getByLabelText(/password/i)).toBeInvalid()
  })

  it('handles custom redirect path', async () => {
    setupAuthMocks({ authenticated: true })
    const user = userEvent.setup()
    
    render(<UserAuthForm redirectTo="/custom-page" />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/custom-page')
    })
  })

  it('shows loading state during submission', async () => {
    setupAuthMocks({ authenticated: false })
    const user = userEvent.setup()
    
    render(<UserAuthForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('displays error message for invalid credentials', async () => {
    setupAuthMocks({ authenticated: false })
    const user = userEvent.setup()
    
    render(<UserAuthForm />)

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid login credentials/i)
    })
  })

  it('handles network errors gracefully', async () => {
    const mockError = new Error('Network error')
    setupAuthMocks({ authenticated: false, error: mockError })
    const user = userEvent.setup()
    
    render(<UserAuthForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i)
    })
  })
}) 