'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

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
    <div className="container relative grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Shifterino
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Check your email to complete your registration.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent you a link to verify your email address. Click the
              link to complete your registration.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
