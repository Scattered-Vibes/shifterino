import { useToast } from '@/components/ui/use-toast'
import { handleError, type AppError } from '@/lib/utils/error-handler'

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
}

function parseError(error: unknown): AppError {
  // Handle Supabase PostgrestError
  if (isPostgrestError(error)) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      originalError: error,
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: error.stack,
      originalError: error,
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: 'STRING_ERROR',
      message: error,
      originalError: error,
    }
  }

  // Default case for unknown error types
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: error,
    originalError: error,
  }
}

export function useErrorHandler() {
  const { toast } = useToast()

  const handleAppError = (error: unknown) => {
    const appError = handleError(error)
    
    // Show toast notification
    toast({
      title: 'Error',
      description: appError.message,
      variant: 'destructive',
    })

    // Log error for debugging
    console.error('Application Error:', {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      originalError: appError.originalError,
    })

    return appError
  }

  return { handleAppError }
}

// Optional: Export the parseError function if needed elsewhere
export { parseError } 