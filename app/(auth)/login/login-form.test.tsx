import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './login-form'
import { Providers } from '@/test/test-utils'
import * as authActions from '../actions'
import type { LoginInput } from '@/lib/validations/auth'
import type { AuthSuccess, AuthError } from '@/types/auth'

// Mock useSearchParams
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

// Mock the login action
vi.mock('../actions', () => ({
  login: vi.fn(),
}))

describe('LoginForm', () => {
  const mockOnSubmit = async (data: LoginInput) => {
    await authActions.login(data)
  }

  it('renders login form', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />, { wrapper: Providers })
    
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} />, { wrapper: Providers })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await act(async () => {
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} />, { wrapper: Providers })

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    await act(async () => {
      await user.type(emailInput, 'invalid-email')
    })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await act(async () => {
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
    })
  })

  it('handles successful form submission', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authActions.login)
    mockLogin.mockResolvedValue({ success: true } as AuthSuccess)
    
    render(<LoginForm onSubmit={mockOnSubmit} />, { wrapper: Providers })

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await act(async () => {
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
    })

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('handles server error', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authActions.login)
    mockLogin.mockResolvedValue({ 
      message: 'Test Error',
      status: 401
    } as AuthError)
    
    render(<LoginForm onSubmit={mockOnSubmit} />, { wrapper: Providers })

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await act(async () => {
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/Test Error/i)).toBeInTheDocument()
    })
  })
})
