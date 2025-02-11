import { PostgrestError } from '@supabase/supabase-js'

export enum ErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
}

export interface AppError {
  code: ErrorCode
  message: string
  originalError?: unknown
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
}

export function handleError(error: unknown): AppError {
  console.error('Error:', error)

  if (error instanceof Error) {
    // Handle Supabase errors
    if ('code' in error && typeof error.code === 'string') {
      switch (error.code) {
        case 'auth/invalid-email':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return {
            code: ErrorCode.AUTHENTICATION_ERROR,
            message: 'Invalid email or password',
            originalError: error,
          }
        case 'auth/email-already-in-use':
          return {
            code: ErrorCode.CONFLICT,
            message: 'Email already in use',
            originalError: error,
          }
        case 'auth/too-many-requests':
          return {
            code: ErrorCode.RATE_LIMIT,
            message: 'Too many attempts. Please try again later',
            originalError: error,
          }
      }
    }

    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message || 'An unexpected error occurred',
      originalError: error,
    }
  }

  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: 'An unexpected error occurred',
    originalError: error,
  }
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  )
}

export function isSupabaseError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error &&
    'hint' in error
  )
}

export function mapSupabaseError(error: PostgrestError): AppError {
  return {
    message: error.message,
    code: ErrorCode.SERVER_ERROR,
    details: error.details,
  }
}

export function getUserFriendlyMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return 'Please check your input and try again'
    case ErrorCode.AUTHENTICATION_ERROR:
      return 'Please sign in to continue'
    case ErrorCode.AUTHORIZATION_ERROR:
      return 'You do not have permission to perform this action'
    case ErrorCode.NOT_FOUND:
      return 'The requested resource was not found'
    case ErrorCode.CONFLICT:
      return 'This operation conflicts with existing data'
    case ErrorCode.RATE_LIMIT:
      return 'Too many attempts. Please try again later'
    case ErrorCode.SERVER_ERROR:
      return 'Server error. Please try again later'
    default:
      return 'An unexpected error occurred'
  }
}

export function getHttpStatus(code: ErrorCode): number {
  switch (code) {
    // 4xx Client Errors
    case ErrorCode.VALIDATION_ERROR:
      return 400 // Bad Request

    case ErrorCode.AUTHENTICATION_ERROR:
      return 401 // Unauthorized

    case ErrorCode.AUTHORIZATION_ERROR:
      return 403 // Forbidden

    case ErrorCode.NOT_FOUND:
      return 404 // Not Found

    case ErrorCode.CONFLICT:
      return 409 // Conflict

    case ErrorCode.RATE_LIMIT:
      return 429 // Too Many Requests

    // 5xx Server Errors
    case ErrorCode.SERVER_ERROR:
      return 500 // Internal Server Error

    default:
      return 500
  }
}