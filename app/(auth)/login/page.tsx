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
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'
import Link from 'next/link'

export default async function LoginPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link 
              href="/signup" 
              className="font-medium text-primary hover:text-primary/90"
            >
              create a new account
            </Link>
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
} 