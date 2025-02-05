import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignUpForm } from './signup-form'
import Link from 'next/link'

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
export default async function SignUpPage() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    redirect('/overview')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-primary hover:text-primary/90"
            >
              Sign in
            </Link>
          </p>
        </div>

        <SignUpForm />
      </div>
    </div>
  )
} 