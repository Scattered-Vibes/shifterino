import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { LoginForm } from '@/app/(auth)/login/login-form'
import { renderWithProviders, mockRouter, resetMocks } from '../../../helpers/test-utils'
import { mockServerAction } from '../../../helpers/test-utils'
import { login } from '@/app/(auth)/actions'

// Mock the server action
vi.mock('@/app/(auth)/actions', () => ({
  login: mockServerAction(async () => ({ data: { redirectTo: '/overview' } }))
}))

describe('LoginForm', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('renders login form', () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles successful form submission', async () => {
    renderWithProviders(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('displays error message on failed login', async () => {
    // Override the mock for this test
    vi.mocked(login).mockResolvedValueOnce({
      error: 'Invalid credentials',
    })

    renderWithProviders(<LoginForm />)

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