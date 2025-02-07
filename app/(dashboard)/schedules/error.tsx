'use client'

import { useEffect } from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function SchedulesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Schedules error:', error)
  }, [error])

  return (
    <Alert variant="destructive">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>Something went wrong!</AlertTitle>
      <AlertDescription className="mt-4 flex flex-col gap-4">
        <p className="text-sm">
          {error.message || 'Failed to load schedules'}
          {error.digest && (
            <span className="block text-xs text-muted-foreground">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <Button variant="outline" size="sm" onClick={() => reset()}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  )
}
