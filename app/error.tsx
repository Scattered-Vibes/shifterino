'use client'

import { useEffect } from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function GlobalError({
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
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-2xl">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Something went wrong!</AlertTitle>
            <AlertDescription className="mt-4 flex flex-col gap-4">
              <p className="text-sm">
                {error.message || 'An unexpected error occurred'}
                {error.digest && (
                  <span className="block text-xs text-muted-foreground">
                    Error ID: {error.digest}
                  </span>
                )}
              </p>
              <div className="flex gap-4">
                <Button variant="outline" size="sm" onClick={() => reset()}>
                  Try again
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = '/')}
                >
                  Go home
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </body>
    </html>
  )
}
