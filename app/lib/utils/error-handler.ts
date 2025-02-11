export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_IN_USE = 'EMAIL_IN_USE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
}

export interface AppError extends Error {
  code: ErrorCode
  status: number
  details?: unknown
}

export function handleError(error: unknown): AppError {
  console.error('Error:', error)

  if (error instanceof Error) {
    const appError: AppError = {
      name: error.name,
      message: error.message,
      code: ErrorCode.UNKNOWN,
      status: 500,
      stack: error.stack,
    }

    // Handle Supabase errors
    if (error.message.includes('Invalid login credentials')) {
      appError.code = ErrorCode.INVALID_CREDENTIALS
      appError.status = 401
    } else if (error.message.includes('User not found')) {
      appError.code = ErrorCode.USER_NOT_FOUND
      appError.status = 404
    } else if (error.message.includes('Email already in use')) {
      appError.code = ErrorCode.EMAIL_IN_USE
      appError.status = 409
    }

    return appError
  }

  return {
    name: 'UnknownError',
    message: 'An unknown error occurred',
    code: ErrorCode.UNKNOWN,
    status: 500,
  } as AppError
}

function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  )
}

function isSupabaseError(error: unknown): error is { message: string; code?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  )
}

function mapSupabaseError(error: { message: string; code?: string }): AppError {
  switch (error.code) {
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return {
        name: 'AuthError',
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
        status: 401,
      }
    case '23505': // unique_violation
      return {
        name: 'AuthError',
        code: ErrorCode.EMAIL_IN_USE,
        message: 'Email already in use',
        status: 409,
      }
    case '23503': // foreign_key_violation
      return {
        name: 'AuthError',
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
        status: 404,
      }
    default:
      return {
        name: 'ServerError',
        code: ErrorCode.SERVER_ERROR,
        message: error.message,
        status: 500,
      }
  }
}

export function getUserFriendlyMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return 'Please check your input and try again'
    case ErrorCode.INVALID_CREDENTIALS:
      return 'Invalid email or password'
    case ErrorCode.USER_NOT_FOUND:
      return 'User not found'
    case ErrorCode.EMAIL_IN_USE:
      return 'Email already in use'
    case ErrorCode.INVALID_TOKEN:
      return 'Invalid token'
    case ErrorCode.EXPIRED_TOKEN:
      return 'Token expired'
    case ErrorCode.SERVER_ERROR:
      return 'A server error occurred'
    default:
      return 'An unexpected error occurred'
  }
}

export function getHttpStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return 400
    case ErrorCode.INVALID_CREDENTIALS:
      return 401
    case ErrorCode.USER_NOT_FOUND:
      return 404
    case ErrorCode.EMAIL_IN_USE:
      return 409
    case ErrorCode.SERVER_ERROR:
      return 500
    default:
      return 500
  }
} 