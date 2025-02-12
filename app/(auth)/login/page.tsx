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
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoginForm } from './login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useSupabase } from '@/app/providers/supabase-provider'
import { useToast } from '@/components/ui/use-toast'
import type { LoginInput } from '@/app/lib/validations/schemas'

export default function LoginPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const handleLogin = async (data: LoginInput) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      
      if (error) {
        toast({
          title: 'Error signing in',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      router.push('/overview')
      router.refresh()
    } catch (error) {
      console.error('Unexpected error during login:', error)
      toast({
        title: 'Error signing in',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container relative flex h-screen flex-col items-center justify-center">
      <Card className="mx-auto w-full max-w-[350px]">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSubmit={handleLogin} />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link 
              href="/signup" 
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            Forgot your password?{' '}
            <Link 
              href="/reset-password" 
              className="text-primary underline-offset-4 hover:underline"
            >
              Reset it here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
