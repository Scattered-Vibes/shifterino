import { AuthError } from '@supabase/supabase-js'

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

interface ErrorWithMessage {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError

  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    // fallback in case there's an error stringifying the maybeError
    return new Error(String(maybeError))
  }
}

export function handleError(error: unknown) {
  if (error instanceof AuthError) {
    // Handle Supabase Auth errors
    return {
      message: error.message,
      status: error.status || 500,
    }
  }

  const errorWithMessage = toErrorWithMessage(error)
  return {
    message: errorWithMessage.message,
    status: 500,
  }
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