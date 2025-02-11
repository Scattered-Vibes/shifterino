'use client'

import { useEffect } from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getUserFriendlyMessage, type ErrorCode } from '@/lib/utils/error-handler'

export default function Error({
  error,
  reset,
}: {
  error: Error & { code?: ErrorCode }
  reset: () => void
}) {
  const errorWithCode = error as Error & { code: ErrorCode }
  
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {getUserFriendlyMessage(errorWithCode)}
        </AlertDescription>
        <Button
          onClick={() => reset()}
          variant="outline"
          className="mt-4"
        >
          Try again
        </Button>
      </Alert>
    </div>
  )
}
