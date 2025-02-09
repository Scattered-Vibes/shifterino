import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LoginForm } from '@/app/(auth)/login/login-form'
import { AuthProvider } from '@/components/providers/AuthProvider'

describe('LoginForm', () => {
  it('renders login form', () => {
    render(
      <AuthProvider initialUser={null}>
        <LoginForm />
      </AuthProvider>
    )

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles form submission', async () => {
    const mockSignIn = vi.fn()
    vi.mock('@/lib/auth', () => ({
      signInWithEmail: mockSignIn,
    }))

    render(
      <AuthProvider initialUser={null}>
        <LoginForm />
      </AuthProvider>
    )

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('displays error message on failed login', async () => {
    const mockSignIn = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
    vi.mock('@/lib/auth', () => ({
      signInWithEmail: mockSignIn,
    }))

    render(
      <AuthProvider initialUser={null}>
        <LoginForm />
      </AuthProvider>
    )

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