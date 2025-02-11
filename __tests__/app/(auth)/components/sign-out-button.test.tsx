import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SignOutButton } from '@/components/ui/sign-out-button'
import { renderWithProviders } from '../../../helpers/test-utils'

// Mock the server action
const mockSignOut = vi.fn()
vi.mock('@/app/(auth)/actions', () => ({
  signOut: () => mockSignOut(),
}))

// Mock the toast component
const mockToast = vi.fn()
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}))

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign out button', () => {
    renderWithProviders(<SignOutButton />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('shows loading state during sign out', async () => {
    mockSignOut.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    renderWithProviders(<SignOutButton />)

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(screen.getByRole('button', { name: /signing out/i })).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })
  })

  it('handles successful sign out', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null })
    renderWithProviders(<SignOutButton />)

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })

  it('handles sign out error', async () => {
    const errorMessage = 'Failed to sign out'
    mockSignOut.mockResolvedValueOnce({ error: errorMessage })
    renderWithProviders(<SignOutButton />)

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error signing out',
        description: errorMessage,
        variant: 'destructive',
      })
    })
  })

  it('handles unexpected errors', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('Network error'))
    renderWithProviders(<SignOutButton />)

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error signing out',
        description: 'Network error',
        variant: 'destructive',
      })
    })
  })
}) 