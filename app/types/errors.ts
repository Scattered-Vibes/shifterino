import { ErrorCode } from '@/lib/utils/error-codes'

export interface AppError {
  code: ErrorCode
  message: string
  description?: string
  details?: unknown
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
} 