'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { login } from '../actions/login'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Debug logging
const requestId = Math.random().toString(36).substring(7)
console.log(`[LoginPage:${requestId}] Initializing`)

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, formAction] = useFormState(login, {})
  const { pending } = useFormStatus()

  // Debug logging
  console.log(`[LoginPage:${requestId}] State:`, {
    state,
    pending,
    redirectTo: searchParams.get('redirectTo')
  })

  // Handle successful login redirect
  useEffect(() => {
    if (state?.success) {
      const redirectTo = searchParams.get('redirectTo') || '/overview'
      console.log(`[LoginPage:${requestId}] Login success, redirecting to:`, redirectTo)
      router.push(redirectTo)
      router.refresh()
    }
  }, [state?.success, router, searchParams])

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to continue
          </p>
        </div>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              disabled={pending}
              autoComplete="username"
              aria-label="Email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={pending}
              autoComplete="current-password"
              aria-label="Password"
            />
          </div>
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error.message}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={pending}
            data-testid="submit-button"
          >
            {pending ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
