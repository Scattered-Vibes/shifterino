import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import CompleteProfilePage from './page'
import { Providers } from '@/test/test-utils'
import { useFormState, useFormStatus } from 'react-dom'
import { createClient } from '@/lib/supabase/client'

// Mock useFormState and useFormStatus
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    useFormState: vi.fn(),
    useFormStatus: vi.fn()
  }
})

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

// Mock the Icons component
vi.mock('@/components/ui/icons', () => ({
  Icons: {
    spinner: () => <div data-testid="spinner" />
  }
}))

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })
}))

describe('CompleteProfilePage', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  }

  beforeEach(() => {
    vi.mocked(useFormState).mockReturnValue([null, vi.fn(), false])
    vi.mocked(useFormStatus).mockReturnValue({
      pending: false,
      data: new FormData(),
      method: null,
      action: null
    })
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    } as any)
  })

  it('renders complete profile form', async () => {
    render(<CompleteProfilePage />, { wrapper: Providers })

    // Wait for user data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.getByRole('textbox', { name: /first name/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /last name/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    const mockFormAction = vi.fn()
    vi.mocked(useFormState).mockReturnValue([null, mockFormAction, false])

    render(<CompleteProfilePage />, { wrapper: Providers })

    // Wait for user data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    const submitButton = screen.getByRole('button', { name: /update profile/i })
    await act(async () => {
      await user.click(submitButton)
    })

    expect(mockFormAction).toHaveBeenCalled()
  })

  it('shows server error message', async () => {
    const mockState = { error: { message: 'Failed to update profile', code: 'DATABASE_ERROR' } }
    vi.mocked(useFormState).mockReturnValue([mockState, vi.fn(), false])

    render(<CompleteProfilePage />, { wrapper: Providers })

    // Wait for user data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
  })

  it('shows loading state when form is submitting', async () => {
    vi.mocked(useFormStatus).mockReturnValue({
      pending: true,
      data: new FormData(),
      method: null,
      action: null
    })

    render(<CompleteProfilePage />, { wrapper: Providers })

    // Wait for user data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
    expect(screen.getByText(/updating/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('includes auth_id in form submission', async () => {
    render(<CompleteProfilePage />, { wrapper: Providers })

    // Wait for user data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    const hiddenInput = screen.getByDisplayValue(mockUser.id)
    expect(hiddenInput).toHaveAttribute('type', 'hidden')
    expect(hiddenInput).toHaveAttribute('name', 'auth_id')
  })
}) 