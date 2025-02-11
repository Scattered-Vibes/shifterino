'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { XCircle } from 'lucide-react'

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
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-lg">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Schedule Error</AlertTitle>
        <AlertDescription>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              {error.message || 'There was an error loading the schedules.'}
            </p>
            <div className="mt-4 space-x-4">
              <Button onClick={reset} variant="secondary">
                Try again
              </Button>
              <Button asChild variant="outline">
                <Link href="/overview">Return to Overview</Link>
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
