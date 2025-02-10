import { z } from 'zod'

export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR'
}

export type AppError = {
  code: ErrorCode
  message: string
  details?: unknown
}

export function handleError(error: unknown): AppError {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation error',
      details: error.errors
    }
  }

  // Handle known AppErrors
  if (isAppError(error)) {
    return error
  }

  // Handle Supabase errors
  if (isSupabaseError(error)) {
    return mapSupabaseError(error)
  }

  // Handle unknown errors
  console.error('Unhandled error:', error)
  return {
    code: ErrorCode.UNKNOWN,
    message: 'An unexpected error occurred'
  }
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
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password'
      }
    case '23505': // unique_violation
      return {
        code: ErrorCode.CONFLICT,
        message: 'Resource already exists'
      }
    case '23503': // foreign_key_violation
      return {
        code: ErrorCode.NOT_FOUND,
        message: 'Referenced resource not found'
      }
    default:
      return {
        code: ErrorCode.DATABASE_ERROR,
        message: error.message
      }
  }
}

export function getUserFriendlyMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return 'Please check your input and try again'
    case ErrorCode.AUTH_INVALID_CREDENTIALS:
      return 'Invalid email or password'
    case ErrorCode.AUTH_UNAUTHORIZED:
      return 'You are not authorized to perform this action'
    case ErrorCode.NOT_FOUND:
      return 'The requested resource was not found'
    case ErrorCode.CONFLICT:
      return 'This action conflicts with existing data'
    case ErrorCode.DATABASE_ERROR:
      return 'A database error occurred'
    case ErrorCode.NETWORK_ERROR:
      return 'A network error occurred'
    case ErrorCode.RATE_LIMIT:
      return 'Too many requests. Please try again later'
    case ErrorCode.SERVER_ERROR:
      return 'A server error occurred'
    default:
      return 'An unexpected error occurred'
  }
} 