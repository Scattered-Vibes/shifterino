import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProfileForm } from '@/app/(dashboard)/profile/profile-form'
import { mockEmployee } from '../../../helpers/mock-data'
import type { ProfileInput } from '@/lib/validations/schemas'

interface UpdateProfileInput extends ProfileInput {
  id: string
  auth_id: string
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

// Mock the server action
const mockUpdateProfile = vi.fn()
vi.mock('@/app/(dashboard)/profile/actions', () => ({
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
    render(<ProfileForm initialData={mockEmployee} />)
    
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue(mockEmployee.email)
    expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue(mockEmployee.first_name)
    expect(screen.getByRole('textbox', { name: /last name/i })).toHaveValue(mockEmployee.last_name)
  })

  it('displays validation errors for required fields', async () => {
    render(<ProfileForm initialData={mockEmployee} />)
    
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

    render(<ProfileForm initialData={mockEmployee} />)
    
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
        ...mockEmployee,
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

    render(<ProfileForm initialData={mockEmployee} />)
    
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