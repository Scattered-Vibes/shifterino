'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function ScheduleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Schedule error:', error)
  }, [error])

  return (
    <div className="container mx-auto flex min-h-[400px] items-center justify-center py-8">
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>Something went wrong!</CardTitle>
          <CardDescription>
            There was an error loading the schedule management interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {process.env.NODE_ENV === 'development' ? (
              <pre className="mt-2 rounded-md bg-slate-950 p-4">
                <code className="text-white">{error.message}</code>
              </pre>
            ) : (
              <p>Please try again later or contact support if the problem persists.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </Button>
          <Button onClick={() => reset()}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  )
} 