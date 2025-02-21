import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserAuthForm } from '@/app/(auth)/components/user-auth-form'
import { mockRouter, mockSupabaseAuth, mockSession, mockSupabaseResponses } from '../../helpers/auth'
import { cookies } from 'next/headers'
import { renderWithProviders } from '../../helpers/test-utils'
import userEvent from '@testing-library/user-event'

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
  redirect: vi.fn(),
  useRouter: () => mockRouter
}))

describe('Login Component', () => {
  const mockSupabase = mockSupabaseAuth()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('UI Behavior', () => {
    it('renders form elements correctly', () => {
      renderWithProviders(<UserAuthForm />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    it('shows loading state during submission', async () => {
      const { user } = renderWithProviders(<UserAuthForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      // Mock the pending state
      vi.mock('react-dom', async () => {
        const actual = await vi.importActual('react-dom')
        return {
          ...actual,
          useFormStatus: () => ({ pending: true })
        }
      })

      await user.click(screen.getByTestId('submit-button'))
      expect(screen.getByTestId('spinner')).toBeInTheDocument()
    })

    it('preserves form state during submission', async () => {
      const { user } = renderWithProviders(<UserAuthForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(screen.getByTestId('submit-button'))

      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
    })

    it('validates required fields', async () => {
      const { user } = renderWithProviders(<UserAuthForm />)
      await user.click(screen.getByTestId('submit-button'))

      expect(screen.getByLabelText(/email/i)).toBeInvalid()
      expect(screen.getByLabelText(/password/i)).toBeInvalid()
    })
  })

  describe('Authentication Flow', () => {
    it('handles successful login', async () => {
      const { user } = renderWithProviders(<UserAuthForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      })

      const cookieStore = cookies()
      expect(cookieStore.set).toHaveBeenCalledWith('sb-session', expect.any(String), {
        httpOnly: true,
        secure: expect.any(Boolean),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      })
    })

    it('handles invalid credentials', async () => {
      const { user } = renderWithProviders(<UserAuthForm />)

      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid login credentials')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      // Mock a network error
      vi.mocked(mockSupabase.auth.signInWithPassword).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { user } = renderWithProviders(<UserAuthForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error')
      })
    })

    it('handles missing credentials', async () => {
      const { user } = renderWithProviders(<UserAuthForm />)
      await user.click(screen.getByTestId('submit-button'))

      expect(screen.getByLabelText(/email/i)).toBeInvalid()
      expect(screen.getByLabelText(/password/i)).toBeInvalid()
    })
  })
}) 