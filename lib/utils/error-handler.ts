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
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  DB_ERROR: 'DB_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_CONSTRAINT_ERROR: 'DB_CONSTRAINT_ERROR',
  DB_VALIDATION_ERROR: 'DB_VALIDATION_ERROR',
  API_ERROR: 'API_ERROR',
  API_REQUEST_ERROR: 'API_REQUEST_ERROR',
  API_RESPONSE_ERROR: 'API_RESPONSE_ERROR',
  API_VALIDATION_ERROR: 'API_VALIDATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_STATE: 'INVALID_STATE',
  CONFLICT: 'CONFLICT',
  SCHEDULE_CONFLICT: 'SCHEDULE_CONFLICT',
  INVALID_SHIFT_PATTERN: 'INVALID_SHIFT_PATTERN',
  OVERTIME_LIMIT_EXCEEDED: 'OVERTIME_LIMIT_EXCEEDED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  OPERATION_FAILED: 'OPERATION_FAILED'
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

export function handleError(error: unknown): { message: string; code: ErrorCodeType } {
  console.error('Error:', error)

  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('Invalid login credentials')) {
      return {
        message: 'Invalid email or password',
        code: ErrorCode.INVALID_CREDENTIALS
      }
    }

    return {
      message: error.message,
      code: ErrorCode.UNKNOWN
    }
  }

  return {
    message: 'An unexpected error occurred',
    code: ErrorCode.UNKNOWN
  }
}

export function handleValidationError(
  errors: ValidationError[],
  context?: Record<string, unknown>
): { message: string; code: ErrorCodeType } {
  return {
    message: 'Validation failed',
    code: ErrorCode.VALIDATION
  }
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

export function mapSupabaseError(error: PostgrestError): { message: string; code: ErrorCodeType } {
  return {
    message: error.message,
    code: ErrorCode.SERVER_ERROR
  }
}

export function getUserFriendlyMessage(code: ErrorCodeType): string {
  switch (code) {
    // Authentication errors
    case ErrorCode.INVALID_CREDENTIALS:
      return 'Invalid username or password.'
    case ErrorCode.USER_NOT_FOUND:
      return 'User not found.'
    case ErrorCode.UNAUTHORIZED:
      return 'You need to be logged in to perform this action.'
    case ErrorCode.FORBIDDEN:
      return 'You do not have sufficient permissions to perform this action.'
    case ErrorCode.SESSION_EXPIRED:
      return 'Your session has expired. Please log in again.'

    // Database errors
    case ErrorCode.DB_ERROR:
      return 'A database error occurred. Please try again later.'
    case ErrorCode.DB_QUERY_ERROR:
      return 'Error retrieving data from the database.'
    case ErrorCode.DB_CONNECTION_ERROR:
      return 'Could not connect to the database.'
    case ErrorCode.DB_CONSTRAINT_ERROR:
      return 'The operation violates database constraints.'
    case ErrorCode.DB_VALIDATION_ERROR:
      return 'Invalid data provided.'

    // API errors
    case ErrorCode.API_ERROR:
      return 'An API error occurred. Please try again.'
    case ErrorCode.API_REQUEST_ERROR:
      return 'Error making API request.'
    case ErrorCode.API_RESPONSE_ERROR:
      return 'Invalid response from API.'
    case ErrorCode.API_VALIDATION_ERROR:
      return 'API validation failed.'

    // Business logic errors
    case ErrorCode.VALIDATION_ERROR:
      return 'Please check your input and try again.'
    case ErrorCode.INVALID_INPUT:
      return 'Invalid input provided.'
    case ErrorCode.INVALID_STATE:
      return 'Operation cannot be performed in current state.'
    case ErrorCode.CONFLICT:
      return 'This action conflicts with existing data.'

    // Schedule-specific errors
    case ErrorCode.SCHEDULE_CONFLICT:
      return 'Schedule conflict detected.'
    case ErrorCode.INSUFFICIENT_STAFF:
      return 'Insufficient staff for the schedule.'
    case ErrorCode.INVALID_SHIFT_PATTERN:
      return 'Invalid shift pattern.'
    case ErrorCode.OVERTIME_LIMIT_EXCEEDED:
      return 'Overtime limit exceeded.'

    // Generic errors
    case ErrorCode.UNKNOWN_ERROR:
      return 'An unknown error occurred. Please try again.'
    case ErrorCode.NOT_IMPLEMENTED:
      return 'This feature is not implemented yet.'
    case ErrorCode.OPERATION_FAILED:
      return 'Operation failed. Please try again.'
    case ErrorCode.SERVER_ERROR:
      return 'An unexpected error occurred. Please try again later.'
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