export interface AuthState {
  error?: {
    message: string
    code: string
  }
  message?: string
}

export type LoginState = AuthState
export type SignUpState = AuthState
export type ResetPasswordState = AuthState
export type UpdatePasswordState = AuthState 