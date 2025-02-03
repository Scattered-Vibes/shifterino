'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

/**
 * CheckEmailPage Component
 * 
 * A client-side component that displays a confirmation message after user signup,
 * instructing them to check their email for an account activation link.
 * 
 * Features:
 * - Displays a card with instructions about checking email
 * - Includes spam folder checking reminder
 * - Provides a link back to the login page
 * 
 * @component
 * @example
 * ```tsx
 * <CheckEmailPage />
 * ```
 * 
 * @returns {JSX.Element} A centered card component with email verification instructions
 */
export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you an email with a confirmation link. Please check your inbox and click the link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            If you don&apos;t see the email, please check your spam folder. The email should arrive within a few minutes.
          </p>
          <div className="flex flex-col space-y-4">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Return to login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 