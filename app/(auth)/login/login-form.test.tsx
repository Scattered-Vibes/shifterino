import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './login-form'
import { Providers } from '@/test/utils/test-utils'

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

describe('LoginForm', () => {
  it('renders login form', () => {
    render(<LoginForm />, { wrapper: Providers })
    
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<LoginForm />, { wrapper: Providers })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows validation error for invalid email', async () => {
    render(<LoginForm />, { wrapper: Providers })
    
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'invalid-email' },
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument()
  })

  it('handles form submission', async () => {
    const user = userEvent.setup()
    render(<LoginForm />, { wrapper: Providers });

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Add assertions based on your form submission logic
  })
})
