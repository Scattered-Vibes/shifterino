'use client'

import { useForm } from 'react-hook-form'
import { useFormState, useFormStatus } from 'react-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateProfile } from '@/lib/auth/actions'
import { useSupabase } from '@/app/providers/SupabaseContext'

const profileSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function UpdateProfileButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          Updating...
        </>
      ) : (
        'Complete Profile'
      )}
    </Button>
  )
}

export function CompleteProfileForm() {
  const { user, employee } = useSupabase()
  const [state, formAction] = useFormState(updateProfile, null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: employee?.first_name || '',
      last_name: employee?.last_name || ''
    }
  })

  if (!user || !employee) {
    return <p>Not authorized</p>
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Complete Profile</CardTitle>
        <CardDescription>
          Please complete your profile to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {state.error.message}
                </AlertDescription>
              </Alert>
            )}
            <input type="hidden" name="auth_id" value={user.id} />
            <input type="hidden" name="id" value={employee.id} />
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <UpdateProfileButton />
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 