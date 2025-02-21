import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserAuthForm } from '@/app/(auth)/components/user-auth-form'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn()
  }))
}))

// Define proper types for form state
interface LoginState {
  error?: { message: string }
  success?: boolean
}

// Create mock functions
const mockFormAction = vi.fn()
const mockFormState = vi.fn()
const mockFormStatus = vi.fn()

// Mock react-dom module
vi.mock('react-dom', () => ({
  experimental_useFormState: mockFormState,
  experimental_useFormStatus: mockFormStatus
}))

describe('UserAuthForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mocks with proper types
    mockFormState.mockReturnValue([{}, mockFormAction, false])
    mockFormStatus.mockReturnValue({ pending: false })
  })

  it('renders form fields correctly', () => {
    render(<UserAuthForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<UserAuthForm />)
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByLabelText(/email/i)).toBeInvalid()
    expect(screen.getByLabelText(/password/i)).toBeInvalid()
  })

  it('disables form fields while submitting', async () => {
    mockFormStatus.mockReturnValue({ pending: true })

    render(<UserAuthForm />)
    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/password/i)).toBeDisabled()
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveTextContent(/signing in\.\.\./i)
  })

  it('handles successful login', async () => {
    const router = useRouter()
    mockFormState.mockReturnValue([{ success: true }, mockFormAction, false])

    render(<UserAuthForm />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled()
      expect(router.push).toHaveBeenCalledWith('/overview')
    })
  })

  it('handles login errors', async () => {
    mockFormState.mockReturnValue([
      { error: { message: 'Invalid login credentials' } },
      mockFormAction,
      false
    ])

    render(<UserAuthForm />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid login credentials/i)
    })
  })
}) 