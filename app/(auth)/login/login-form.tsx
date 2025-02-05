'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from './actions'
import { useSearchParams } from 'next/navigation'
import { useFormState } from 'react-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

type LoginState = {
  message: string | null
}

const initialState: LoginState = {
  message: null
}

export default function LoginForm() {
  const [state, formAction] = useFormState(login, initialState)
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  return (
    <div className="mt-8 bg-white px-6 py-8 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <form action={formAction} className="space-y-4">
        {state?.message && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            required
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className="w-full"
          />
        </div>
        <input type="hidden" name="returnTo" value={returnTo ?? ''} />
        <Button 
          className="w-full" 
          type="submit"
        >
          Sign In
        </Button>
      </form>
    </div>
  )
} 