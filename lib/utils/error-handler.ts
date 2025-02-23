import { PostgrestError, AuthError } from '@supabase/supabase-js'
import { type ValidationError } from '@/types/scheduling/common'

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: unknown
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
    let details: unknown
    
    if (error instanceof AppError) {
      message = error.message
      details = error.details
    } else if (error instanceof AuthError) {
      message = 'Authentication error: ' + error.message
      details = { code: error.status }
    } else if (error instanceof PostgrestError) {
      message = customErrorMap?.[error.code] || error.message
      details = { code: error.code, details: error.details, hint: error.hint }
    } else if (error instanceof Error) {
      message = error.message
      details = error.stack
    }
    
    console.error('[handleClientError] Error details:', { message, details })
    
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
    let details: unknown
    
    if (error instanceof AppError) {
      status = error.statusCode
      message = error.message
      details = error.details
    } else if (error instanceof PostgrestError) {
      message = error.message
      details = { code: error.code, details: error.details, hint: error.hint }
    } else if (error instanceof Error) {
      message = error.message
      details = error.stack
    }
    
    console.error('[handleServerError] Error details:', { status, message, details })
    
    return Response.json(
      { error: message, details },
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

export function handleError(error: unknown, code: ErrorCode = ErrorCode.UNKNOWN): never {
  console.error('[handleError] Original error:', error)

  if (error instanceof AppError) {
    console.error('[handleError] AppError:', { 
      message: error.message, 
      code: error.code, 
      statusCode: error.statusCode,
      details: error.details 
    })
    throw error
  }

  if (error instanceof PostgrestError) {
    console.error('[handleError] PostgrestError:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    throw new AppError(error.message, code, 500, {
      code: error.code,
      details: error.details,
      hint: error.hint
    })
  }

  if (error instanceof AuthError) {
    console.error('[handleError] AuthError:', {
      message: error.message,
      status: error.status
    })
    throw new AppError(error.message, code, error.status || 500)
  }

  if (error instanceof Error) {
    console.error('[handleError] Error:', {
      message: error.message,
      stack: error.stack
    })
    throw new AppError(error.message, code, 500, { stack: error.stack })
  }

  console.error('[handleError] Unknown error type:', error)
  throw new AppError('An unknown error occurred', code, 500, { originalError: error })
}

export function handleValidationError(
  errors: ValidationError[],
  context?: Record<string, unknown>
): { message: string; code: ErrorCode } {
  console.error('[handleValidationError] Validation errors:', { errors, context })
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
    console.error('[assertNonNullable] Assertion failed:', { message, code, context })
    throw new AppError(message, code, 500, context)
  }
}

export function getUserFriendlyMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
      return 'You need to be logged in to perform this action.'
    case ErrorCode.FORBIDDEN:
      return 'You do not have permission to perform this action.'
    case ErrorCode.NOT_FOUND:
      return 'The requested resource was not found.'
    case ErrorCode.VALIDATION_ERROR:
      return 'Please check your input and try again.'
    case ErrorCode.DATABASE_ERROR:
      return 'A database error occurred. Please try again later.'
    case ErrorCode.INTERNAL_ERROR:
    case ErrorCode.INTERNAL_SERVER_ERROR:
      return 'An unexpected error occurred. Please try again later.'
    case ErrorCode.UNAUTHENTICATED:
      return 'Please log in to continue.'
    case ErrorCode.RATE_LIMIT:
      return 'Too many attempts. Please try again later.'
    case ErrorCode.UNKNOWN:
    default:
      return 'An unexpected error occurred.'
  }
}

export function getHttpStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return 400
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.UNAUTHENTICATED:
      return 401
    case ErrorCode.FORBIDDEN:
      return 403
    case ErrorCode.NOT_FOUND:
      return 404
    case ErrorCode.RATE_LIMIT:
      return 429
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.INTERNAL_ERROR:
    case ErrorCode.INTERNAL_SERVER_ERROR:
    case ErrorCode.UNKNOWN:
    default:
      return 500
  }
}