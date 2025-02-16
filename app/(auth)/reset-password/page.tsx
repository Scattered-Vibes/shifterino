'use client'

import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { resetPassword } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function ResetPasswordButton() {
  const { pending } = useFormStatus()
 
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          Sending reset link...
        </>
      ) : (
        'Reset Password'
      )}
    </Button>
  )
}

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(resetPassword, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <form action={formAction} className="space-y-4">
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="text-sm text-destructive">
              {state.error.message}
            </div>
          )}
          {state?.message && (
            <div className="text-sm text-green-500">
              {state.message}
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <ResetPasswordButton />
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
