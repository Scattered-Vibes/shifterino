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
if (process.env.NODE_ENV === 'test') {
  console.log('[UserAuthForm] Imports loaded')
  console.log('[UserAuthForm] useFormState available:', typeof useFormState)
  console.log('[UserAuthForm] useFormStatus available:', typeof useFormStatus)
}

export function UserAuthForm() {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[UserAuthForm:${requestId}] Initializing`)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, formAction] = useFormState(login, {})
  const { pending } = useFormStatus()

  // Debug logging
  console.log(`[UserAuthForm:${requestId}] State:`, {
    state,
    pending,
    redirectTo: searchParams.get('redirectTo')
  })

  // Handle successful login redirect
  useEffect(() => {
    if (state?.success) {
      const redirectTo = searchParams.get('redirectTo') || '/overview'
      console.log(`[UserAuthForm:${requestId}] Login success, redirecting to:`, redirectTo)
      router.push(redirectTo)
    }
  }, [state?.success, router, searchParams, requestId])

  // Wrap formAction to add logging
  const handleSubmit = async (formData: FormData) => {
    console.log(`[UserAuthForm:${requestId}] Form submission:`, {
      email: formData.get('email'),
      hasPassword: !!formData.get('password')
    })
    return formAction(formData)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>DEBUG: Login Form Loaded</div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          required
          disabled={pending}
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
        />
      </div>
      {state?.error && (
        <Alert variant="destructive" role="alert">
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
  )
}