/**
 * Login page component for the 911 Dispatch Center application
 * Provides email/password authentication with error handling and loading states
 *
 * Features:
 * - Email and password form inputs with validation
 * - Loading state during authentication
 * - Error display for failed login attempts
 * - Links to signup and password recovery
 * - Responsive layout with centered card design
 *
 * @component
 * @example
 * ```tsx
 * <LoginPage />
 * ```
 */
import Link from 'next/link'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to sign in to your account
        </p>
      </div>
      <LoginForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link
          href="/signup"
          className="hover:text-brand underline underline-offset-4"
        >
          Don&apos;t have an account? Sign Up
        </Link>
      </p>
    </>
  )
}
