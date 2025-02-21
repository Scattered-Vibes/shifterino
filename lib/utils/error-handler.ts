import { PostgrestError, AuthError } from '@supabase/supabase-js'
import { type ValidationError } from '@/types/scheduling/common'

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public status: number = 500,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

type ToastFunction = (options: { title: string; description: string; variant?: 'default' | 'destructive' }) => void

export async function handleClientError<T>(
  operation: () => Promise<T>,
  toast: ToastFunction,
  customErrorMap?: Record<string, string>
): Promise<T | null> {
  try {
    return await operation()
  } catch (err) {
    const error = err as Error
    console.error('Client operation failed:', error)
    
    let message = 'An unexpected error occurred'
    
    if (error instanceof AppError) {
      message = error.message
    } else if (error instanceof AuthError) {
      message = 'Authentication error: ' + error.message
    } else if (error instanceof PostgrestError) {
      message = customErrorMap?.[error.code] || error.message
    } else if (error instanceof Error) {
      message = error.message
    }
    
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive'
    })
    
    return null
  }
}

export async function handleServerError<T>(
  operation: () => Promise<T>,
  defaultMessage = 'An internal server error occurred'
): Promise<Response> {
  try {
    const result = await operation()
    return Response.json(result)
  } catch (err) {
    const error = err as Error
    console.error('Server operation failed:', error)
    
    let status = 500
    let message = defaultMessage
    
    if (error instanceof AppError) {
      status = error.status
      message = error.message
    } else if (error instanceof AuthError) {
      status = 401
      message = 'Authentication failed: ' + error.message
    } else if (error instanceof PostgrestError) {
      status = 400
      message = error.message
    } else if (error instanceof Error) {
      message = error.message
    }
    
    return Response.json(
      { error: message },
      { status }
    )
  }
}

export function createErrorMap(errors: Record<string, string>): Record<string, string> {
  return {
    '23505': 'A record with this information already exists.',
    '23503': 'This operation would violate referential integrity.',
    '23514': 'This operation would violate a check constraint.',
    ...errors
  }
}

// Helper to determine if an error is a specific type
export function isPostgrestError(error: unknown): error is PostgrestError {
  return error instanceof PostgrestError
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function handleError(error: unknown): { message: string; code: ErrorCode } {
  console.error('Error:', error)

  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code
    }
  }

  if (error instanceof Error) {
    // Handle Supabase auth errors
    if ('status' in error && typeof error.status === 'number') {
      switch (error.status) {
        case 400:
          if (error.message.includes('schema')) {
            return {
              message: 'Database configuration error. Please contact support.',
              code: ErrorCode.DATABASE_ERROR
            }
          }
          return {
            message: 'Invalid request. Please check your input.',
            code: ErrorCode.VALIDATION_ERROR
          }
        case 401:
          return {
            message: 'Invalid email or password',
            code: ErrorCode.UNAUTHORIZED
          }
        case 422:
          return {
            message: 'Invalid email or password format',
            code: ErrorCode.VALIDATION_ERROR
          }
        case 429:
          return {
            message: 'Too many attempts. Please try again later.',
            code: ErrorCode.RATE_LIMIT
          }
        case 500:
          if (error.message.includes('schema')) {
            return {
              message: 'Database configuration error. Please contact support.',
              code: ErrorCode.DATABASE_ERROR
            }
          }
          return {
            message: 'An unexpected server error occurred.',
            code: ErrorCode.INTERNAL_ERROR
          }
      }
    }

    if (error.message.includes('Invalid login credentials')) {
      return {
        message: 'Invalid email or password',
        code: ErrorCode.UNAUTHORIZED
      }
    }

    if (error.message.includes('schema')) {
      return {
        message: 'Database configuration error. Please contact support.',
        code: ErrorCode.DATABASE_ERROR
      }
    }

    return {
      message: error.message,
      code: ErrorCode.INTERNAL_ERROR
    }
  }

  return {
    message: 'An unexpected error occurred',
    code: ErrorCode.INTERNAL_ERROR
  }
}

export function handleValidationError(
  _errors: ValidationError[],
  _context?: Record<string, unknown>
): { message: string; code: ErrorCode } {
  return {
    message: 'Validation failed',
    code: ErrorCode.VALIDATION_ERROR
  }
}

export function assertNonNullable<T>(
  value: T | null | undefined,
  message: string,
  code: ErrorCode,
  context?: Record<string, unknown>
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AppError(message, code, 500, context)
  }
}

export function getUserFriendlyMessage(code: ErrorCode): string {
  switch (code) {
    // Authentication errors
    case ErrorCode.UNAUTHORIZED:
      return 'You need to be logged in to perform this action.'
    case ErrorCode.INTERNAL_ERROR:
      return 'An unexpected error occurred. Please try again later.'

    // Database errors
    case ErrorCode.DATABASE_ERROR:
      return 'A database error occurred. Please try again later.'

    // Validation errors
    case ErrorCode.VALIDATION_ERROR:
      return 'Please check your input and try again.'

    // Rate limit errors
    case ErrorCode.RATE_LIMIT:
      return 'Too many attempts. Please try again later.'

    // Generic errors
    default:
      return 'An unexpected error occurred.'
  }
}

export function getHttpStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return 400
    case ErrorCode.UNAUTHORIZED:
      return 401
    case ErrorCode.RATE_LIMIT:
      return 429
    case ErrorCode.DATABASE_ERROR:
      return 500
    default:
      return 500
  }
}