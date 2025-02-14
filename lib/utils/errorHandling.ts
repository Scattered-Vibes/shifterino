import { PostgrestError } from '@supabase/supabase-js'
import { ErrorCode } from './error-codes'

export interface AppError {
  code: keyof typeof ErrorCode
  message: string
  details?: unknown
  originalError?: unknown
}

export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
}

export function handleError(error: unknown): AppError {
  console.error('Error caught:', error)

  // Handle Supabase PostgrestError
  if (isPostgrestError(error)) {
    return {
      code: 'DB_ERROR',
      message: error.message,
      details: error.details,
      originalError: error
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Handle auth-related errors
    if (error.message.includes('Invalid login credentials')) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        originalError: error
      }
    }

    if (error.message.includes('Email not confirmed')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Please confirm your email address',
        originalError: error
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: error.stack,
      originalError: error
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      originalError: new Error(error)
    }
  }

  // Default case
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: error
  }
}

export function mapErrorToToast(error: AppError) {
  return {
    title: 'Error',
    description: error.message,
    variant: 'destructive' as const
  }
}

export function getHttpStatus(code: keyof typeof ErrorCode): number {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400
    case 'INVALID_CREDENTIALS':
      return 401
    case 'UNAUTHORIZED':
      return 401
    case 'FORBIDDEN':
      return 403
    case 'NOT_FOUND':
      return 404
    case 'CONFLICT':
      return 409
    case 'SERVER_ERROR':
      return 429
    default:
      return 500
  }
}

export function getUserFriendlyMessage(code: keyof typeof ErrorCode): string {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password'
    case 'AUTH_ERROR':
      return 'Please confirm your email address'
    case 'UNAUTHORIZED':
      return 'You need to be logged in'
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action'
    case 'NOT_FOUND':
      return 'The requested resource was not found'
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again'
    case 'CONFLICT':
      return 'This operation conflicts with existing data'
    case 'SERVER_ERROR':
      return 'Too many requests. Please try again later'
    case 'DB_ERROR':
      return 'A database error occurred'
    default:
      return 'An unexpected error occurred'
  }
} 