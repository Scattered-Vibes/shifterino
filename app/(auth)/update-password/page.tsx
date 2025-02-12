'use client'

import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import Link from 'next/link'
import { updatePassword } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordRequirements } from '@/components/ui/password-requirements'
import { type UpdatePasswordState } from '@/app/(auth)/auth'

function UpdatePasswordButton() {
  const { pending } = useFormStatus()
 
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      Update Password
    </Button>
  )
}

export default function UpdatePasswordPage() {
  const [state, formAction] = useFormState<UpdatePasswordState | null, FormData>(updatePassword, null)
  const [password, setPassword] = useState('')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Password</CardTitle>
        <CardDescription>
          Enter your new password
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
            <Label htmlFor="password">New Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
          <UpdatePasswordButton />
          <div className="text-sm text-muted-foreground text-center">
            <Link
              href="/login"
              className="hover:text-primary underline underline-offset-4"
            >
              Back to login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
} 