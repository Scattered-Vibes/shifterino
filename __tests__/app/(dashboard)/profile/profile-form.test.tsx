import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProfileForm } from '@/components/profile/profile-form'
import { mockEmployees } from '@/test/mock-data'
import type { UpdateProfileInput } from '@/types/profile'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

// Mock the server action
const mockUpdateProfile = vi.fn()
vi.mock('@/(dashboard)/profile/actions', () => ({
  updateProfile: (data: UpdateProfileInput) => mockUpdateProfile(data),
}))

// Mock the toast component
const mockToast = vi.fn()
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with initial data', () => {
    render(<ProfileForm initialData={mockEmployees[0]} />)
    
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue(mockEmployees[0].email)
    expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue(mockEmployees[0].first_name)
    expect(screen.getByRole('textbox', { name: /last name/i })).toHaveValue(mockEmployees[0].last_name)
  })

  it('displays validation errors for required fields', async () => {
    render(<ProfileForm initialData={mockEmployees[0]} />)
    
    // Clear required fields
    fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
      target: { value: '' },
    })
    
    // Submit form
    fireEvent.submit(screen.getByRole('form'))
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
    })
  })

  it('handles successful profile update', async () => {
    mockUpdateProfile.mockResolvedValueOnce({ success: true })

    render(<ProfileForm initialData={mockEmployees[0]} />)
    
    // Update form fields
    fireEvent.change(screen.getByRole('textbox', { name: /first name/i }), {
      target: { value: 'Jane' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: /last name/i }), {
      target: { value: 'Smith' },
    })
    
    // Submit form
    fireEvent.submit(screen.getByRole('form'))
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        ...mockEmployees[0],
        first_name: 'Jane',
        last_name: 'Smith',
      })
      
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Your profile has been updated successfully.',
      })
    })
  })

  it('handles server errors', async () => {
    const errorMessage = 'Failed to update profile'
    mockUpdateProfile.mockResolvedValueOnce({ error: errorMessage })

    render(<ProfileForm initialData={mockEmployees[0]} />)
    
    // Submit form
    fireEvent.submit(screen.getByRole('form'))
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      })
    })
  })
}) 