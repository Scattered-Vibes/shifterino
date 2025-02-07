'use client'

import { SignupForm } from './signup-form'

/**
 * SignUpPage Component
 *
 * A client-side component that handles user registration for the 911 Dispatch Center.
 * Provides a form for collecting user information and handles the signup process.
 *
 * Features:
 * - Collects user's first name, last name, email, password
 * - Allows selection of preferred shift pattern (Pattern A or B)
 * - Handles form submission and displays loading/error states
 * - Provides navigation to login page for existing users
 *
 * @component
 * @example
 * ```tsx
 * <SignUpPage />
 * ```
 */
export default function SignupPage() {
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
              &ldquo;Join our team and help streamline emergency response
              scheduling.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your details to get started
            </p>
          </div>
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
