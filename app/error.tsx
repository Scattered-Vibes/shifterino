'use client'

import { useEffect } from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getUserFriendlyMessage, ErrorCode } from '@/app/lib/utils/error-handler'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Alert variant="destructive" className="w-full max-w-2xl">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {getUserFriendlyMessage(ErrorCode.UNKNOWN_ERROR)}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-2 rounded-md bg-slate-950 p-4 text-sm text-white">
              <code>{error.message}</code>
              {error.digest && (
                <div className="mt-2 text-xs text-slate-400">
                  Error ID: {error.digest}
                </div>
              )}
            </pre>
          )}
          <div className="mt-4 flex gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reset()}
            >
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
