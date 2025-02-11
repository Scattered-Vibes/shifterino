import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SignOutButton } from '@/components/ui/sign-out-button'
import { useToast } from '@/components/ui/use-toast'
import * as authActions from '@/app/(auth)/actions'

// Mock the useToast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(),
}))

// Mock the signOut action
vi.mock('@/app/(auth)/actions', () => ({
  signOut: vi.fn(),
}))

describe('SignOutButton', () => {
  it('renders without crashing', () => {
    render(<SignOutButton />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls signOut action on click', async () => {
    const signOutMock = vi.spyOn(authActions, 'signOut')
    signOutMock.mockResolvedValue({})

    render(<SignOutButton />)
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1)
    })
  })

  it('disables button while loading', async () => {
    const signOutMock = vi.spyOn(authActions, 'signOut')
    signOutMock.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)))
    render(<SignOutButton />)

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(screen.getByRole('button', { name: /signing out/i })).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign out/i })).toBeEnabled()
    }, { timeout: 1000 })
  })

  it('displays error message on failed sign out', async () => {
    const signOutMock = vi.spyOn(authActions, 'signOut')

    const mockToast = {
      toast: vi.fn()
    }
    ;(useToast as jest.Mock).mockReturnValue(mockToast)

    const errorMessage = 'Test Error'
    signOutMock.mockResolvedValue({ error: errorMessage })
    render(<SignOutButton />)
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Error signing out',
        description: errorMessage,
        variant: 'destructive',
      })
    })
  })
})