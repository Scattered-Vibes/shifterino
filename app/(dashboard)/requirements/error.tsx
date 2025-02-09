'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center rounded-lg border p-6 text-center">
        <h2 className="mb-4 text-xl font-semibold">Something went wrong!</h2>
        <p className="mb-4 text-muted-foreground">
          {error.message || 'Failed to load settings. Please try again.'}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
