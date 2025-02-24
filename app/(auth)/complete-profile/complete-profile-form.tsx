'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useFormState } from 'react-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/auth-provider'
import { toast } from 'sonner'
import type { AuthenticatedUser } from '@/types/auth'

const profileSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  shift_pattern: z.enum(['4x10', '3x12_1x4']).default('4x10'),
  preferred_shift_category: z.enum(['day', 'swing', 'night']).default('day'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface UserMetadata {
  first_name?: string
  last_name?: string
  shift_pattern?: ProfileFormValues['shift_pattern']
  preferred_shift_category?: ProfileFormValues['preferred_shift_category']
  profile_incomplete?: boolean
}

function UpdateProfileButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={isPending}>
      {isPending ? (
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
  const router = useRouter()
  const { user } = useAuth()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const metadata = user?.user_metadata as UserMetadata | undefined

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: metadata?.first_name || '',
      last_name: metadata?.last_name || '',
      shift_pattern: metadata?.shift_pattern || '4x10',
      preferred_shift_category: metadata?.preferred_shift_category || 'day',
    }
  })

  if (!user) {
    return <p>Not authorized</p>
  }

  const onSubmit = async (data: ProfileFormValues) => {
    setError(null)
    
    startTransition(async () => {
      try {
        const supabase = createClient()

        // Update employee record
        const { error: employeeError } = await supabase
          .from('employees')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            shift_pattern: data.shift_pattern,
            preferred_shift_category: data.preferred_shift_category,
            updated_at: new Date().toISOString(),
          })
          .eq('auth_id', user.id)

        if (employeeError) throw employeeError

        // Update user metadata
        const { error: userError } = await supabase.auth.updateUser({
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            shift_pattern: data.shift_pattern,
            preferred_shift_category: data.preferred_shift_category,
            profile_incomplete: false, // Mark profile as complete
          } as UserMetadata
        })

        if (userError) throw userError

        toast.success('Profile completed successfully')
        router.refresh()
        router.push('/overview')
      } catch (err) {
        console.error('Profile completion error:', err)
        setError(err instanceof Error ? err.message : 'Failed to complete profile')
        toast.error('Failed to complete profile')
      }
    })
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        <CardDescription>
          Please provide your information to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your first name" />
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
                    <Input {...field} placeholder="Enter your last name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shift_pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shift Pattern</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your shift pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4x10">4x10 (Four 10-hour shifts)</SelectItem>
                        <SelectItem value="3x12_1x4">3x12 + 1x4 (Three 12-hour shifts + One 4-hour shift)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferred_shift_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Shift Category</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your preferred shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day Shift</SelectItem>
                        <SelectItem value="swing">Swing Shift</SelectItem>
                        <SelectItem value="night">Night Shift</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <UpdateProfileButton isPending={isPending} />
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 