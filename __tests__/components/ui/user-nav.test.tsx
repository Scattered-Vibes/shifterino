import { render, screen, fireEvent } from '@/test/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserNav } from '@/components/ui/user-nav'
import { useSupabase } from '@/app/providers/SupabaseContext'
import type { User } from '@supabase/supabase-js'
import type { Employee } from '@/types/models/employee'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'

// Mock useSupabase hook
vi.mock('@/app/providers/SupabaseContext', () => ({
  useSupabase: vi.fn()
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock auth actions
vi.mock('@/lib/auth/actions', () => ({
  signOut: vi.fn()
}))

describe('UserNav', () => {
  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
  }

  const mockEmployee: Employee = {
    id: 'emp123',
    auth_id: 'user123',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'dispatcher',
    shift_pattern: '4x10',
    weekly_hours_cap: 40,
    max_overtime_hours: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    updated_by: null,
  }

  // Mock Supabase client
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  } as unknown as SupabaseClient<Database>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user initials and email when user and employee are present', () => {
    vi.mocked(useSupabase).mockReturnValue({
      user: mockUser,
      employee: mockEmployee,
      isSigningOut: false,
      signOut: vi.fn(),
      supabase: mockSupabase,
    })

    render(<UserNav />)
    
    expect(screen.getByText('TU')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders nothing when user is null', () => {
    vi.mocked(useSupabase).mockReturnValue({
      user: null,
      employee: mockEmployee,
      isSigningOut: false,
      signOut: vi.fn(),
      supabase: mockSupabase,
    })

    render(<UserNav />)
    
    expect(screen.queryByText('TU')).not.toBeInTheDocument()
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument()
  })

  it('renders nothing when employee is null', () => {
    vi.mocked(useSupabase).mockReturnValue({
      user: mockUser,
      employee: null,
      isSigningOut: false,
      signOut: vi.fn(),
      supabase: mockSupabase,
    })

    render(<UserNav />)
    
    expect(screen.queryByText('TU')).not.toBeInTheDocument()
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument()
  })

  it('shows loading state when signing out', () => {
    vi.mocked(useSupabase).mockReturnValue({
      user: mockUser,
      employee: mockEmployee,
      isSigningOut: true,
      signOut: vi.fn(),
      supabase: mockSupabase,
    })

    render(<UserNav />)
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('calls signOut function when sign out button is clicked', async () => {
    const mockSignOut = vi.fn()
    vi.mocked(useSupabase).mockReturnValue({
      user: mockUser,
      employee: mockEmployee,
      isSigningOut: false,
      signOut: mockSignOut,
      supabase: mockSupabase,
    })

    render(<UserNav />)
    
    const signOutButton = screen.getByRole('button', { name: /sign out/i })
    await fireEvent.click(signOutButton)
    
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
}) 