import { PostgrestError } from '@supabase/supabase-js'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

export interface ErrorResponse {
  message: string
  code: ErrorCode
  details?: unknown
}

export function handleError(error: unknown): ErrorResponse {
  // Handle known error types
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code as ErrorCode
    }
  }

  if (error instanceof ZodError) {
    return {
      message: 'Validation error',
      code: ErrorCodes.VALIDATION_ERROR,
      details: error.errors
    }
  }

  // Handle Supabase errors
  if (isPostgrestError(error)) {
    return handleDatabaseError(error)
  }

  // Handle unknown errors
  console.error('Unhandled error:', error)
  return {
    message: 'An unexpected error occurred',
    code: ErrorCodes.UNKNOWN_ERROR
  }
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

function handleDatabaseError(error: PostgrestError): ErrorResponse {
  // Handle specific database errors
  switch (error.code) {
    case '23505': // unique_violation
      return {
        message: 'A record with this information already exists',
        code: ErrorCodes.DATABASE_ERROR,
        details: error.details
      }
    case '23503': // foreign_key_violation
      return {
        message: 'Referenced record does not exist',
        code: ErrorCodes.DATABASE_ERROR,
        details: error.details
      }
    default:
      return {
        message: 'Database error occurred',
        code: ErrorCodes.DATABASE_ERROR,
        details: error.details
      }
  }
}

export function createErrorResponse(
  message: string,
  code: ErrorCode = ErrorCodes.UNKNOWN_ERROR,
  details?: unknown
): ErrorResponse {
  return { message, code, details }
}

// Helper function to throw common errors
export const throwError = {
  unauthorized(message = 'Unauthorized') {
    throw new AppError(message, ErrorCodes.UNAUTHORIZED, 401)
  },
  notFound(message = 'Resource not found') {
    throw new AppError(message, ErrorCodes.NOT_FOUND, 404)
  },
  validation(message = 'Validation error') {
    throw new AppError(message, ErrorCodes.VALIDATION_ERROR, 400)
  },
  database(message = 'Database error') {
    throw new AppError(message, ErrorCodes.DATABASE_ERROR, 500)
  }
} 