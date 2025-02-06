'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AuthError } from '@supabase/supabase-js'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error boundary caught:', error)
  }, [error])

  const errorMessage = React.useMemo(() => {
    if (error instanceof AuthError) {
      switch (error.status) {
        case 400:
          return 'Invalid authentication request'
        case 401:
          return 'Your session has expired. Please sign in again.'
        case 403:
          return 'You do not have permission to access this resource'
        default:
          return 'An authentication error occurred'
      }
    }

    // Database errors
    if (error.message.includes('PGRST')) {
      return 'A database error occurred. Please try again.'
    }

    // Network errors
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.'
    }

    // Default error message
    return error.message || 'An unexpected error occurred'
  }, [error])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>
      <div className="flex space-x-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    </div>
  )
} 