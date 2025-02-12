/**
 * SignUpPage Component
 *
 * Server Component that handles the signup page rendering and initial auth check.
 */

'use client'

import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordRequirements } from '@/components/ui/password-requirements'
import { type SignUpState } from '@/app/(auth)/auth'

function SignUpButton() {
  const { pending } = useFormStatus()
 
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      Create Account
    </Button>
  )
}

export default function SignUpPage() {
  const [state, formAction] = useFormState<SignUpState | null, FormData>(signup, null)
  const [password, setPassword] = useState('')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>
          Enter your details to create your account
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error ? (
            <div className="text-sm text-red-500">
              {state.error.message}
            </div>
          ) : null}
          {state?.message ? (
            <div className="text-sm text-green-500">
              {state.message}
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
