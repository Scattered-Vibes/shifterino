import { PostgrestError } from '@supabase/supabase-js'
import { type ValidationError } from '@/types/scheduling/common'

export const ErrorCode = {
  UNKNOWN: 'UNKNOWN',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  INVALID_SCHEDULE_PERIOD: 'INVALID_SCHEDULE_PERIOD',
  NO_EMPLOYEES_FOUND: 'NO_EMPLOYEES_FOUND',
  NO_SHIFT_OPTIONS: 'NO_SHIFT_OPTIONS',
  NO_STAFFING_REQUIREMENTS: 'NO_STAFFING_REQUIREMENTS',
  INSUFFICIENT_STAFF: 'INSUFFICIENT_STAFF',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR'
} as const

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]

export class AppError extends Error {
  code: ErrorCodeType
  details?: Record<string, unknown>

  constructor(message: string, code: ErrorCodeType, details?: Record<string, unknown>) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
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

export function handleError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): never {
  console.error('Error:', message, error, context)

  if (error instanceof AppError) {
    throw error
  }

  if (error instanceof Error) {
    throw new AppError(
      `${message}: ${error.message}`,
      ErrorCode.DATABASE,
      { originalError: error.message, ...context }
    )
  }

  throw new AppError(
    message,
    ErrorCode.UNKNOWN,
    { originalError: error, ...context }
  )
}

export function handleValidationError(
  errors: ValidationError[],
  context?: Record<string, unknown>
): never {
  throw new AppError(
    'Validation failed',
    ErrorCode.VALIDATION,
    {
      validationErrors: errors,
      ...context
    }
  )
}

export function assertNonNullable<T>(
  value: T | null | undefined,
  message: string,
  code: ErrorCodeType,
  context?: Record<string, unknown>
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AppError(message, code, context)
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

export function getUserFriendlyMessage(code: ErrorCodeType): string {
  switch (code) {
    case ErrorCode.VALIDATION:
      return 'The provided data is invalid.'
    case ErrorCode.UNAUTHORIZED:
      return 'You need to be logged in to perform this action.'
    case ErrorCode.FORBIDDEN:
      return 'You do not have permission to perform this action.'
    case ErrorCode.NOT_FOUND:
      return 'The requested resource was not found.'
    case ErrorCode.RATE_LIMIT:
      return 'Too many requests. Please try again later.'
    case ErrorCode.SERVER_ERROR:
      return 'An unexpected error occurred. Please try again later.'
    case ErrorCode.INVALID_SCHEDULE_PERIOD:
      return 'The schedule period is invalid.'
    case ErrorCode.NO_EMPLOYEES_FOUND:
      return 'No employees were found.'
    case ErrorCode.NO_SHIFT_OPTIONS:
      return 'No shift options were found.'
    case ErrorCode.NO_STAFFING_REQUIREMENTS:
      return 'No staffing requirements were found.'
    case ErrorCode.INSUFFICIENT_STAFF:
      return 'There are not enough staff members to meet the requirements.'
    default:
      return 'An unexpected error occurred.'
  }
}

export function getHttpStatus(code: ErrorCodeType): number {
  switch (code) {
    case ErrorCode.VALIDATION:
      return 400
    case ErrorCode.UNAUTHORIZED:
      return 401
    case ErrorCode.FORBIDDEN:
      return 403
    case ErrorCode.NOT_FOUND:
      return 404
    case ErrorCode.RATE_LIMIT:
      return 429
    case ErrorCode.SERVER_ERROR:
      return 500
    default:
      return 500
  }
}