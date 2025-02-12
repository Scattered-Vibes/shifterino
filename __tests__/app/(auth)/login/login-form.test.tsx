import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { LoginForm } from '@/(auth)/login/login-form'
import { render } from '@/test/test-utils'
import type { LoginInput } from '@/lib/validations/auth'

// Mock the server action
vi.mock('@/lib/auth/actions', () => ({
  login: vi.fn()
}))

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn<[LoginInput], Promise<void>>()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles successful form submission', async () => {
    mockOnSubmit.mockResolvedValueOnce()
    
    render(<LoginForm onSubmit={mockOnSubmit} />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('displays error message on failed login', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Invalid credentials'))

    render(<LoginForm onSubmit={mockOnSubmit} />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })
}) 