import type { EmployeeRole } from './index'
import type { Session } from '@supabase/supabase-js'

declare interface AuthenticatedUser {
  userId: string;
  employeeId: string;
  role: EmployeeRole;
  email: string;
  isNewUser: boolean;
}

declare type AuthError = {
  message: string;
  code?: string;
}

declare type BaseAuthState = {
  error?: AuthError;
  success?: boolean;
}

// Each state type extends BaseAuthState with its specific additions
declare interface LoginState extends BaseAuthState {
  session?: Session;
}

declare interface SignUpState extends BaseAuthState {
  message?: string;
}

declare interface ResetPasswordState extends BaseAuthState {
  message?: string;
}

declare interface UpdatePasswordState extends BaseAuthState {
  message?: string;
}

declare interface UpdateProfileState extends BaseAuthState {
  message?: string;
}

// Export all types
export type { 
  AuthenticatedUser, 
  AuthError, 
  BaseAuthState,
  LoginState,
  SignUpState,
  ResetPasswordState,
  UpdatePasswordState,
  UpdateProfileState
} 