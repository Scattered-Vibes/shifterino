export type UserRole = 'dispatcher' | 'supervisor' | 'manager'

export interface AuthSession {
  user: {
    id: string
    role: UserRole
  }
  expires: string
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  first_name: string | null
  last_name: string | null
} 