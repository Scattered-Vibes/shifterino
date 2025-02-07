'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Profile error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Profile Error</h1>
        <p className="mb-8 text-gray-600">
          {error.message || 'There was an error loading your profile.'}
        </p>
        <div className="space-x-4">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/overview">Return to Overview</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
