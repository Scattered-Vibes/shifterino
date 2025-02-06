'use client'

import * as React from 'react'
import { useEffect } from 'react'
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
    console.error('Fatal error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background text-foreground">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Something went terribly wrong!
            </h2>
            <p className="text-muted-foreground">
              The application encountered a fatal error and cannot continue.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 rounded-md bg-slate-950 p-4 text-sm text-white">
                <code>{error.message}</code>
              </pre>
            )}
          </div>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </body>
    </html>
  )
} 