import { ErrorCode } from '@/lib/utils/error-handler'
import type { User } from '@supabase/supabase-js'
import type { Database } from './supabase/database'
import type { Employee, EmployeeRole } from './models/employee'

type Tables = Database['public']['Tables']

export type UserRole = 'dispatcher' | 'supervisor' | 'manager'

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

export interface AuthSuccess {
  success: true
}

export interface AuthError {
  message: string
  status: number
  name?: string
}

export type AuthResult = AuthSuccess | AuthError

export interface SignOutResult {
  success?: boolean
  error?: string
  code?: ErrorCode
}

// Session Types
export interface Session {
  user: AuthUser
  expires_at: number
  refresh_token?: string
  access_token: string
}

// Auth State Types
export interface AuthState {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  error: Error | null
}

// Auth Action Types
export type AuthAction =
  | { type: 'SET_SESSION'; payload: Session }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }

// Auth Operation Types
export interface SignUpData {
  email: string
  password: string
  first_name: string
  last_name: string
  role: EmployeeRole
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

// Auth Response Types
export interface AuthResponse {
  session: Session | null
  user: AuthUser | null
  error: AuthError | null
}

// Auth Provider Types
export interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  error: Error | null
  signUp: (data: SignUpData) => Promise<AuthResponse>
  signIn: (data: SignInData) => Promise<AuthResponse>
  signOut: () => Promise<void>
  resetPassword: (data: ResetPasswordData) => Promise<AuthResponse>
  updatePassword: (data: UpdatePasswordData) => Promise<AuthResponse>
}

// Auth Middleware Types
export interface AuthResult {
  isAuthenticated: boolean
  isAuthorized: boolean
  user: AuthUser | null
  error?: AuthError
}

export interface AuthOptions {
  requireAuth?: boolean
  requiredRole?: EmployeeRole
}

// Auth Log Types
export type AuthLog = Tables['auth_logs']['Row']
export type AuthLogInsert = Tables['auth_logs']['Insert']

// Auth Operation Types
export type AuthOperation = 
  | 'SIGN_UP'
  | 'SIGN_IN'
  | 'SIGN_OUT'
  | 'RESET_PASSWORD'
  | 'UPDATE_PASSWORD'
  | 'REFRESH_TOKEN'
  | 'VERIFY_EMAIL'

// Auth Validation Types
export interface AuthValidation {
  isValid: boolean
  errors: {
    field: string
    message: string
  }[]
}

// Auth Rate Limit Types
export interface RateLimit {
  remaining: number
  reset: number
  total: number
}

// Auth Event Types
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
  user?: AuthUser
  error?: AuthError
} 