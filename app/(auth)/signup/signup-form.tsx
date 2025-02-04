'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signup } from './actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { useFormState } from 'react-dom'

type SignupState = {
  message: string | null
}

const initialState: SignupState = {
  message: null
}

export function SignUpForm() {
  const [state, formAction] = useFormState(signup, initialState)

  return (
    <div className="mt-8 bg-white px-6 py-8 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <form action={formAction} className="space-y-4">
        {state?.message && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              autoComplete="email"
              className="w-full"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters and contain uppercase, lowercase, and numbers
            </p>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full"
            />
          </div>
        </div>
        <Button className="w-full" type="submit">
          Create Account
        </Button>
      </form>
    </div>
  )
} 