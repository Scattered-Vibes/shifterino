import { Metadata } from 'next'
import { LoginForm } from './login-form'
import { type SearchParams } from '@/types/next'

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

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
}

interface LoginPageProps {
  searchParams: SearchParams
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = searchParams.redirectTo as string | undefined

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to sign in
        </p>
      </div>
      <LoginForm redirectTo={redirectTo} />
    </>
  )
}
