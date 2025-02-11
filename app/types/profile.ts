import type { EmployeeRole, ShiftPattern, ShiftCategory } from './index'

export interface UpdateProfileInput {
  id: string
  auth_id: string
  first_name: string
  last_name: string
  email: string
  role: EmployeeRole
  shift_pattern: ShiftPattern
  preferred_shift_category: ShiftCategory | null
}

export interface ProfileResponse {
  success: boolean
  error?: string
  data?: {
    user: UpdateProfileInput
  }
} 