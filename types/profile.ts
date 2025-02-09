export interface UpdateProfileInput {
  id: string
  auth_id: string
  first_name: string
  last_name: string
  email: string
  role: 'dispatcher' | 'supervisor'
  shift_pattern: 'pattern_a' | 'pattern_b'
  preferred_shift_category: 'day' | 'swing' | 'graveyard'
}

export interface ProfileResponse {
  success: boolean
  error?: string
  data?: {
    user: UpdateProfileInput
  }
} 