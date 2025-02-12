import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SignOutButton } from '@/components/ui/sign-out-button'
import { useToast } from '@/components/ui/use-toast'
import { signOut } from '@/lib/auth/actions'
import { render } from '@/test/test-utils'
import { ErrorCode } from '@/lib/utils/error-handler'
import type { SignOutResult } from '@/types/auth'

// Mock the useToast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn().mockReturnValue({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: []
  })
}))

// Mock the signOut action
vi.mock('@/lib/auth/actions', () => ({
  signOut: vi.fn<[], Promise<SignOutResult>>()
}))

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<SignOutButton />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls signOut action on click', async () => {
    vi.mocked(signOut).mockResolvedValueOnce({ success: true })

    render(<SignOutButton />)
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1)
    })
  })

  it('displays error message on failed sign out', async () => {
    const mockToast = vi.fn()
    vi.mocked(useToast).mockReturnValue({ 
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: []
    })

    vi.mocked(signOut).mockResolvedValueOnce({ 
      error: 'Failed to sign out',
      code: ErrorCode.AUTHENTICATION_ERROR
    })

    render(<SignOutButton />)
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error signing out',
        description: 'Failed to sign out',
        variant: 'destructive',
      })
    })
  })
})