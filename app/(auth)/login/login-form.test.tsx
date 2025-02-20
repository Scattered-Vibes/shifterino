import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { LoginForm } from './login-form'
import { Providers } from '@/test/test-utils'
import * as authActions from '../actions'
import type { LoginInput } from '@/lib/validations/auth'
import type { AuthSuccess, AuthError } from '@/types/auth'
import { useFormState, useFormStatus } from 'react-dom'
import type { AuthState } from '@/app/(auth)/auth'

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

// Mock useFormState and useFormStatus
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    useFormState: vi.fn(),
    useFormStatus: vi.fn()
  }
})

// Mock the Icons component
vi.mock('@/components/ui/icons', () => ({
  Icons: {
    spinner: () => <div data-testid="spinner" />
  }
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.mocked(useFormState).mockReturnValue([null, vi.fn(), false])
    vi.mocked(useFormStatus).mockReturnValue({
      pending: false,
      data: new FormData(),
      method: null,
      action: null
    })
  })

  const mockOnSubmit = async (data: LoginInput) => {
    await authActions.login(data)
  }

  it('renders login form', () => {
    render(<LoginForm />, { wrapper: Providers })
    
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    const mockFormAction = vi.fn()
    vi.mocked(useFormState).mockReturnValue([null, mockFormAction, false])

    render(<LoginForm />, { wrapper: Providers })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await act(async () => {
      await user.click(submitButton)
    })

    expect(mockFormAction).toHaveBeenCalled()
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />, { wrapper: Providers })

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
    
    render(<LoginForm />, { wrapper: Providers })

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
    
    render(<LoginForm />, { wrapper: Providers })

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

  it('shows server error message', async () => {
    const mockState: AuthState = { error: { message: 'Invalid credentials', code: 'AUTH_ERROR' } }
    vi.mocked(useFormState).mockReturnValue([mockState, vi.fn(), false])

    render(<LoginForm />, { wrapper: Providers })

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('shows loading state when form is submitting', async () => {
    vi.mocked(useFormStatus).mockReturnValue({
      pending: true,
      data: new FormData(),
      method: null,
      action: null
    })

    render(<LoginForm />, { wrapper: Providers })

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('includes redirectTo in form submission', async () => {
    const redirectTo = '/overview'
    const mockFormAction = vi.fn()
    vi.mocked(useFormState).mockReturnValue([null, mockFormAction, false])

    render(<LoginForm redirectTo={redirectTo} />, { wrapper: Providers })

    const hiddenInput = screen.getByDisplayValue(redirectTo)
    expect(hiddenInput).toHaveAttribute('type', 'hidden')
    expect(hiddenInput).toHaveAttribute('name', 'redirectTo')
  })
})
