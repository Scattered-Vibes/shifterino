import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserAuthForm } from '@/app/(auth)/components/user-auth-form'
import { setupAuthMocks, mockRouter } from '../../helpers/auth'

describe('Login Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully logs in with valid credentials', async () => {
    const mockSupabase = setupAuthMocks({ authenticated: true })
    const user = userEvent.setup()

    render(<UserAuthForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
      expect(mockRouter.replace).toHaveBeenCalledWith('/overview')
    })
  })

  it('displays error message for invalid credentials', async () => {
    const mockSupabase = setupAuthMocks({ authenticated: false })
    const user = userEvent.setup()

    render(<UserAuthForm />)

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })
  })

  it('displays network error message when auth service is down', async () => {
    setupAuthMocks({ 
      authenticated: false,
      error: { message: 'Auth service unavailable', status: 503 }
    })
    const user = userEvent.setup()

    render(<UserAuthForm />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/auth service unavailable/i)).toBeInTheDocument()
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<UserAuthForm />)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/please enter your email/i)).toBeInTheDocument()
      expect(screen.getByText(/please enter your password/i)).toBeInTheDocument()
    })
  })

  it('redirects to custom path when provided', async () => {
    const mockSupabase = setupAuthMocks({ authenticated: true })
    const user = userEvent.setup()
    const customRedirect = '/dashboard/settings'

    render(<UserAuthForm redirectTo={customRedirect} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled()
      expect(mockRouter.replace).toHaveBeenCalledWith(customRedirect)
    })
  })

  it('disables form fields and shows loading spinner while submitting', async () => {
    setupAuthMocks({ authenticated: true })
    const user = userEvent.setup()

    render(<UserAuthForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
}) 