'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface DashboardErrorProps {
  title: string
  message: string
  showRetry?: boolean
}

export function DashboardError({
  title,
  message,
  showRetry = true,
}: DashboardErrorProps) {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      {showRetry && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => router.refresh()}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
