import { ErrorCode } from './error-codes'

export interface AppError {
  code: ErrorCode
  message: string
  description?: string
  details?: unknown
}

export function getUserFriendlyMessage(code: ErrorCode): string {
  switch (code) {
    // Authentication errors
    case ErrorCode.AUTH_ERROR:
      return 'Authentication error occurred. Please try again.'
    case ErrorCode.INVALID_CREDENTIALS:
      return 'Invalid username or password.'
    case ErrorCode.USER_NOT_FOUND:
      return 'User not found.'
    case ErrorCode.UNAUTHORIZED:
      return 'You are not authorized to perform this action.'
    case ErrorCode.SESSION_EXPIRED:
      return 'Your session has expired. Please log in again.'

    // Database errors
    case ErrorCode.DB_ERROR:
      return 'Database error occurred. Please try again.'
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
      return 'API error occurred. Please try again.'
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
      return 'Operation conflicts with existing data.'

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

    default:
      return 'An error occurred. Please try again.'
  }
}

export function handleError(error: unknown): AppError {
  if (error && typeof error === 'object' && 'code' in error) {
    return error as AppError
  }

  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: 'An unknown error occurred',
    details: error,
  }
} 