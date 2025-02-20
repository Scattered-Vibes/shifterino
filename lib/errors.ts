export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  DATABASE = 'DATABASE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public cause?: Error
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function getHttpStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
      return 401
    case ErrorCode.FORBIDDEN:
      return 403
    case ErrorCode.NOT_FOUND:
      return 404
    case ErrorCode.VALIDATION_ERROR:
      return 400
    case ErrorCode.DATABASE:
    case ErrorCode.UNKNOWN:
    default:
      return 500
  }
} 