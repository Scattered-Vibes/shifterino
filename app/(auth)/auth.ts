import type { Database } from '@/types/supabase/database'

export type UserRole = Database['public']['Tables']['employees']['Row']['role']

export type AuthState = {
  error?: {
    message: string
    code?: string
    details?: string
  }
  message?: string
  success?: boolean
}

export type UpdateProfileState = {
  error?: {
    message: string
    code?: string
  }
  success?: boolean
}

export type AuthenticatedUser = {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
  firstName?: string | null
  lastName?: string | null
}

// ... existing code ...