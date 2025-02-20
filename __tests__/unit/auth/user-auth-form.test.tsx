import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserAuthForm } from '@/app/(auth)/components/user-auth-form'
import { mockRouter } from '../../helpers/auth'
import * as React from 'react'

interface LoginState {
  error?: { message: string }
  success?: boolean
  redirectTo?: string
}

// Mock hooks directly on React
const useTransition = vi.spyOn(React, 'useTransition')
const mockStartTransition = vi.fn()

// Mock form state hook
const mockFormState = vi.fn((action: any, initialState: LoginState | null) => [initialState, action])
vi.mock('react-dom', () => ({
  useFormState: (action: any, initialState: LoginState | null) => mockFormState(action, initialState)
}))

describe('UserAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTransition.mockReturnValue([false, mockStartTransition])
  })

  it('renders login form with required fields', () => {
    render(<UserAuthForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('includes hidden redirectTo field with default value', () => {
    render(<UserAuthForm />)
    
    const redirectInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    expect(redirectInput).toHaveValue('/overview')
  })

  it('includes custom redirectTo when provided', () => {
    render(<UserAuthForm redirectTo="/custom-page" />)
    
    const redirectInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    expect(redirectInput).toHaveValue('/custom-page')
  })

  it('disables form fields while submitting', async () => {
    useTransition.mockReturnValue([true, mockStartTransition])
    
    render(<UserAuthForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/password/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
  })

  it('shows loading spinner while submitting', async () => {
    useTransition.mockReturnValue([true, mockStartTransition])
    
    render(<UserAuthForm />)
    
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('displays error message when login fails', () => {
    mockFormState.mockReturnValue([
      { error: { message: 'Invalid credentials' } },
      vi.fn()
    ])
    
    render(<UserAuthForm />)
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('redirects on successful login', async () => {
    mockFormState.mockReturnValue([
      { success: true, redirectTo: '/overview' },
      vi.fn()
    ])
    
    render(<UserAuthForm />)
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/overview')
    })
  })

  it('uses custom redirect path on successful login', async () => {
    mockFormState.mockReturnValue([
      { success: true, redirectTo: '/custom-page' },
      vi.fn()
    ])
    
    render(<UserAuthForm redirectTo="/custom-page" />)
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/custom-page')
    })
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<UserAuthForm />)
    
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    expect(screen.getByLabelText(/email/i)).toBeInvalid()
    expect(screen.getByLabelText(/password/i)).toBeInvalid()
  })
}) 