/**
 * SignUpPage Component
 *
 * Server Component that handles the signup page rendering and initial auth check.
 */

'use client'

import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signUp } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordRequirements } from '@/components/ui/password-requirements'
import { useState } from 'react'

function SignUpButton() {
  const { pending } = useFormStatus()
 
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          Creating account...
        </>
      ) : (
        'Create account'
      )}
    </Button>
  )
}

export default function SignUpPage() {
  const [state, formAction] = useFormState(signUp, null)
  const [password, setPassword] = useState('')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>
          Enter your details to create your account
        </CardDescription>
      </CardHeader>
      <form action={formAction} className="space-y-4">
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="text-sm text-destructive">
              {state.error.message}
            </div>
          )}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              required
            >
              <option value="DISPATCHER">Dispatcher</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          <PasswordRequirements password={password} />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <SignUpButton />
          <div className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link
              href="/login"
              className="hover:text-primary underline underline-offset-4"
            >
              Login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
