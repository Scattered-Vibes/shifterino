import { PostgrestError } from '@supabase/supabase-js'

export enum ErrorCode {
  // Database errors
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_CONSTRAINT_ERROR = 'DB_CONSTRAINT_ERROR',
  
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  
  // Schedule errors
  SCHEDULE_CONFLICT = 'SCHEDULE_CONFLICT',
  SCHEDULE_UPDATE_FAILED = 'SCHEDULE_UPDATE_FAILED',
  SCHEDULE_INVALID_TIME = 'SCHEDULE_INVALID_TIME',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface AppError {
  code: ErrorCode
  message: string
  details?: unknown
  status?: number
}

export class ApplicationError extends Error {
  code: ErrorCode
  details?: unknown
  status?: number

  constructor(error: AppError) {
    super(error.message)
    this.name = 'ApplicationError'
    this.code = error.code
    this.details = error.details
    this.status = error.status
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

export function handleError(error: unknown): ApplicationError {
  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', error)
  }

  // Handle Supabase PostgrestError
  if (isPostgrestError(error)) {
    const postgrestError = error as PostgrestError
    
    // Map common Postgres error codes
    switch (postgrestError.code) {
      case '23505': // unique_violation
        return new ApplicationError({
          code: ErrorCode.DB_CONSTRAINT_ERROR,
          message: 'A record with this information already exists.',
          details: postgrestError.details,
          status: 409
        })
      case '23503': // foreign_key_violation
        return new ApplicationError({
          code: ErrorCode.DB_CONSTRAINT_ERROR,
          message: 'Referenced record does not exist.',
          details: postgrestError.details,
          status: 409
        })
      default:
        return new ApplicationError({
          code: ErrorCode.DB_QUERY_ERROR,
          message: 'Database operation failed.',
          details: postgrestError,
          status: 500
        })
    }
  }

  // Handle known application errors
  if (error instanceof ApplicationError) {
    return error
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return new ApplicationError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message,
      details: error,
      status: 500
    })
  }

  // Handle unknown errors
  return new ApplicationError({
    code: ErrorCode.UNKNOWN_ERROR,
    message: 'An unexpected error occurred.',
    details: error,
    status: 500
  })
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApplicationError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred.'
}

export function getUserFriendlyMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.DB_CONNECTION_ERROR:
      return 'Unable to connect to the server. Please check your internet connection and try again.'
    case ErrorCode.DB_QUERY_ERROR:
      return 'There was a problem retrieving the data. Please try again later.'
    case ErrorCode.DB_CONSTRAINT_ERROR:
      return 'This operation cannot be completed due to data constraints.'
    case ErrorCode.AUTH_INVALID_CREDENTIALS:
      return 'Invalid credentials. Please check your email and password.'
    case ErrorCode.AUTH_SESSION_EXPIRED:
      return 'Your session has expired. Please sign in again.'
    case ErrorCode.AUTH_UNAUTHORIZED:
      return 'You do not have permission to perform this action.'
    case ErrorCode.SCHEDULE_CONFLICT:
      return 'This schedule conflicts with existing assignments. Please choose different times.'
    case ErrorCode.SCHEDULE_UPDATE_FAILED:
      return 'Failed to update the schedule. Please try again later.'
    case ErrorCode.SCHEDULE_INVALID_TIME:
      return 'Invalid time selection. Please check your start and end times.'
    case ErrorCode.VALIDATION_ERROR:
      return 'Please check your input and try again.'
    case ErrorCode.NETWORK_ERROR:
      return 'Network connection issue. Please check your internet connection.'
    default:
      return 'An unexpected error occurred. Please try again later.'
  }
} 