'use client'

import { useTransition } from 'react'
import { useFormState } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '../actions/login'
import { Alert } from '@/components/ui/alert'

interface UserAuthFormProps {
  redirectTo?: string
}

export function UserAuthForm({ redirectTo = '/overview' }: UserAuthFormProps) {
  const [isPending, startTransition] = useTransition()
  const [state, formAction] = useFormState(login, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive" role="alert">
          {state.error.message}
        </Alert>
      )}
      
      <div className="space-y-2">
        <Input
          name="email"
          type="email"
          placeholder="Email"
          required
          disabled={isPending}
          aria-label="Email"
          className="w-full"
        />
        
        <Input
          name="password"
          type="password"
          placeholder="Password"
          required
          disabled={isPending}
          aria-label="Password"
          className="w-full"
        />

        <input type="hidden" name="redirectTo" value={redirectTo} />
        
        <Button 
          type="submit" 
          disabled={isPending}
          aria-busy={isPending}
          className="w-full"
        >
          {isPending ? (
            <>
              <span className="loading loading-spinner" data-testid="spinner" />
              <span className="ml-2">Signing in...</span>
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </div>
    </form>
  )
}