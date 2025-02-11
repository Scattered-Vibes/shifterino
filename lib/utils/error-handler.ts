export type ErrorCode = 
  | 'AUTH_ERROR'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'SERVER_ERROR';

export interface AppError extends Error {
  code: ErrorCode;
  message: string;
}

export function isAppError(error: unknown): error is AppError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error
  )
}

export function getUserFriendlyMessage(error: Error | AppError): string {
  if (isAppError(error)) {
    switch (error.code) {
      case 'AUTH_ERROR':
        return 'Authentication failed. Please check your credentials and try again.';
      case 'DATABASE_ERROR':
        return 'There was an error accessing the database. Please try again later.';
      case 'VALIDATION_ERROR':
        return error.message || 'Invalid input provided. Please check your data and try again.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'SERVER_ERROR':
        return 'An unexpected error occurred. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
  return error.message || 'An unexpected error occurred. Please try again later.';
}

export function createAppError(code: ErrorCode, message: string): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  return error;
}