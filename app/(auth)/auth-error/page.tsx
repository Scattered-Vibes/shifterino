'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  const requestId = searchParams.get('request_id')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-red-600">
            Authentication Error
          </CardTitle>
          <CardDescription>
            There was a problem with your authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error || 'Authentication Failed'}</AlertTitle>
            <AlertDescription>
              {message || 'Please try signing in again. If the problem persists, contact support.'}
              {requestId && (
                <p className="mt-2 text-xs text-gray-500">
                  Request ID: {requestId}
                </p>
              )}
            </AlertDescription>
          </Alert>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">You can try:</p>
            <ul className="list-inside list-disc space-y-2 text-sm text-gray-600">
              <li>Checking your email for verification links</li>
              <li>Making sure you're using the correct email address</li>
              <li>Clearing your browser cookies and cache</li>
              <li>Resetting your password if you're having trouble signing in</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button variant="default" className="w-full" asChild>
            <Link href="/login">Return to sign in</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/reset-password">Reset password</Link>
          </Button>
          <p className="mt-4 text-center text-xs text-gray-500">
            Need help? Contact{' '}
            <a
              href="mailto:support@example.com"
              className="text-blue-600 hover:text-blue-800"
            >
              support
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
