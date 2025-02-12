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

import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { login } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { type LoginState } from '@/app/(auth)/auth'

function LoginButton() {
  const { pending } = useFormStatus()
 
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      Login
    </Button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useFormState<LoginState | null, FormData>(login, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error ? (
            <div className="text-sm text-red-500">
              {state.error.message}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <LoginButton />
          <div className="text-sm text-muted-foreground text-center">
            <Link
              href="/reset-password"
              className="hover:text-primary underline underline-offset-4"
            >
              Forgot your password?
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
