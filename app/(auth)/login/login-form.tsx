'use client'

import { login } from '@/app/(auth)/actions'
import { useForm } from 'react-hook-form'
import { useFormState, useFormStatus } from 'react-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import type { LoginState } from '@/types/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Icons } from '@/components/ui/icons'

interface LoginFormProps {
  redirectTo?: string
}

function LoginButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full"
      disabled={pending}
    >
      {pending ? (
        <>
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        'Sign in'
      )}
    </Button>
  )
}

export function LoginForm({ redirectTo = '/overview' }: LoginFormProps) {
  const [state, formAction] = useFormState(login, null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

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
              placeholder="name@example.com"
              autoComplete="email"
              required
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
        </div>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <LoginButton />
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
