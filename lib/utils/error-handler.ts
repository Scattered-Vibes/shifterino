export enum ErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR'
}

export interface AppError {
  message: string
  code: ErrorCode
  details?: unknown
}

export function handleError(error: unknown): AppError {
  console.error('Error:', error)

  if (error instanceof Error) {
    // Handle known error types
    if ('code' in error) {
      const { code } = error as { code: string }
      
      switch (code) {
        case 'PGRST301':
          return {
            message: 'Resource not found',
            code: ErrorCode.NOT_FOUND
          }
        case 'PGRST409':
          return {
            message: 'Conflict with existing resource',
            code: ErrorCode.CONFLICT
          }
        case '42501':
          return {
            message: 'You do not have permission to perform this action',
            code: ErrorCode.AUTHORIZATION_ERROR
          }
        case 'PGRST204':
          return {
            message: 'Invalid input data',
            code: ErrorCode.VALIDATION_ERROR
          }
      }
    }

    return {
      message: error.message || 'An unexpected error occurred',
      code: ErrorCode.UNKNOWN_ERROR,
      details: error
    }
  }

  return {
    message: 'An unexpected error occurred',
    code: ErrorCode.UNKNOWN_ERROR,
    details: error
  }
}

export function getUserFriendlyMessage(error: AppError): string {
  switch (error.code) {
    case ErrorCode.VALIDATION_ERROR:
      return 'Please check your input and try again'
    case ErrorCode.AUTHENTICATION_ERROR:
      return 'Please sign in to continue'
    case ErrorCode.AUTHORIZATION_ERROR:
      return 'You do not have permission to perform this action'
    case ErrorCode.NOT_FOUND:
      return 'The requested resource was not found'
    case ErrorCode.CONFLICT:
      return 'This action conflicts with existing data'
    case ErrorCode.SERVER_ERROR:
      return 'A server error occurred. Please try again later'
    default:
      return error.message || 'An unexpected error occurred'
  }
}

export function createAppError(code: ErrorCode, message: string): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  return error;
}