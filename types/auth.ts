import { ErrorCode } from '@/lib/utils/error-handler'
import type { User } from '@supabase/supabase-js'
import type { Database } from './supabase/database'
import type { Employee, EmployeeRole } from './models/employee'

// Core types from database
type Tables = Database['public']['Tables']
export type UserRole = Database['public']['Enums']['employee_role']
export type ShiftPattern = Database['public']['Enums']['shift_pattern']

// Auth State Types
export type AuthState = {
  error?: {
    message: string
    code?: string
  }
  success?: boolean
}

// Derived state types
export type LoginState = AuthState
export type SignUpState = AuthState
export type ResetPasswordState = AuthState
export type UpdatePasswordState = AuthState
export type UpdateProfileState = AuthState

export type SignOutState = { error: { message: string; code?: string } } | null

// Core authenticated user type
export type AuthenticatedUser = {
  userId: string
  employeeId: string
  role: UserRole
  email: string
  isNewUser: boolean
  firstName?: string | null
  lastName?: string | null
  shiftPattern: ShiftPattern
}

// Auth error types
export type AuthError = {
  message: string
  code?: string
  status?: number
}

// Auth operation types
export type AuthOperation = 
  | 'SIGN_UP'
  | 'SIGN_IN'
  | 'SIGN_OUT'
  | 'RESET_PASSWORD'
  | 'UPDATE_PASSWORD'
  | 'REFRESH_TOKEN'
  | 'VERIFY_EMAIL'

// Auth event types
export type AuthEventType = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'PASSWORD_RESET'

export interface AuthEvent {
  type: AuthEventType
  session?: Session
  user?: AuthenticatedUser
  error?: AuthError
}

// Form data types
export interface SignUpData {
  email: string
  password: string
  first_name: string
  last_name: string
  role: UserRole
}

export interface SignInData {
  email: string
  password: string
}

export interface ResetPasswordData {
  email: string
}

export interface UpdatePasswordData {
  password: string
}

// Response types
export interface AuthResponse {
  session: Session | null
  user: AuthenticatedUser | null
  error: AuthError | null
}

// Middleware types
export interface AuthMiddlewareResult {
  isAuthenticated: boolean
  isAuthorized: boolean
  user: AuthenticatedUser | null
  error?: AuthError
}

export interface AuthOptions {
  requireAuth?: boolean
  requiredRole?: UserRole
}

// Rate limiting
export interface RateLimit {
  remaining: number
  reset: number
  total: number
}

// Session type
export interface Session {
  user: AuthenticatedUser
  expires_at: number
  refresh_token?: string
  access_token: string
}

// Auth Provider Types
export interface AuthContextType {
  user: AuthenticatedUser | null
  session: Session | null
  isLoading: boolean
  error: Error | null
  signUp: (data: SignUpData) => Promise<AuthResponse>
  signIn: (data: SignInData) => Promise<AuthResponse>
  signOut: () => Promise<void>
  resetPassword: (data: ResetPasswordData) => Promise<AuthResponse>
  updatePassword: (data: UpdatePasswordData) => Promise<AuthResponse>
}

// Auth Action Types
export type AuthAction =
  | { type: 'SET_SESSION'; payload: Session }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }

export interface AuthSession {
  user: {
    id: string
    role: UserRole
  }
  expires: string
}

export interface AuthUser extends User {
  id: string
  email: string
  role: EmployeeRole
  first_name: string | null
  last_name: string | null
  employee?: Employee
}

export type AuthResult = {
  success: boolean
  error?: {
    message: string
    code: string
  }
}

export interface SignOutResult {
  success?: boolean
  error?: string
  code?: typeof ErrorCode
} 