'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import type { Database } from '@/types/supabase/database'
import type { User } from '@supabase/supabase-js'

type Employee = Database['public']['Tables']['employees']['Row']

const profileFormSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  shift_pattern: z.enum(['pattern_a', 'pattern_b']),
  preferred_shift_category: z.enum(['early', 'day', 'swing', 'graveyard']).nullable(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  user: User
  employee: Employee & {
    shift_pattern: 'pattern_a' | 'pattern_b'
  }
}

export function ProfileForm({ user, employee }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: user.email ?? '',
      shift_pattern: employee.shift_pattern,
      preferred_shift_category: employee.preferred_shift_category,
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsPending(true)
      const supabase = createClient()

      // Update email if changed
      if (data.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        })

        if (emailError) throw emailError
      }

      // Update employee profile
      const { error: profileError } = await supabase
        .from('employees')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          shift_pattern: data.shift_pattern,
          preferred_shift_category: data.preferred_shift_category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employee.id)

      if (profileError) throw profileError

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      console.error('Profile update error:', err)
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={!isEditing || isPending}
                  placeholder="Enter your first name"
                />
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
                <Input
                  {...field}
                  disabled={!isEditing || isPending}
                  placeholder="Enter your last name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  disabled={!isEditing || isPending}
                  placeholder="Enter your email"
                />
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
              <Select
                disabled={!isEditing || isPending}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shift pattern" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pattern_a">Pattern A (4x10)</SelectItem>
                  <SelectItem value="pattern_b">Pattern B (3x12)</SelectItem>
                </SelectContent>
              </Select>
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
              <Select
                disabled={!isEditing || isPending}
                onValueChange={field.onChange}
                defaultValue={field.value ?? undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred shift" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="early">Early (5AM-3PM)</SelectItem>
                  <SelectItem value="day">Day (9AM-7PM)</SelectItem>
                  <SelectItem value="swing">Swing (3PM-1AM)</SelectItem>
                  <SelectItem value="graveyard">Graveyard (9PM-7AM)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  form.reset()
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
