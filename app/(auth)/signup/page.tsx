/**
 * SignUpPage Component
 *
 * Server Component that handles the signup page rendering and initial auth check.
 */

import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/auth/signup-form'
import { createServerClient } from '@/lib/supabase/server'

export default async function SignupPage() {
  const supabase = createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()

  // If user is already logged in, redirect to appropriate page
  if (session?.user) {
    redirect('/overview')
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details below to create your account
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
