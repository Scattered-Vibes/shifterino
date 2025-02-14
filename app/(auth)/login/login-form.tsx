'use client'

import { login } from '@/app/(auth)/actions'
import { type LoginState } from '@/app/(auth)/auth'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction] = useFormState<LoginState | null, FormData>(
    (prevState: LoginState | null, formData: FormData) => login(prevState, formData, redirectTo),
    null
  )
  const { pending } = useFormStatus()

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {state.error.message}
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </div>
        </div>
        <Button 
          type="submit" 
          className="w-full"
          disabled={pending}
        >
          {pending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      <div className="flex flex-col gap-2 text-center text-sm">
        <Link 
          href="/reset-password" 
          className="text-muted-foreground hover:text-primary"
        >
          Forgot password?
        </Link>
        <div className="text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link 
            href="/signup" 
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
