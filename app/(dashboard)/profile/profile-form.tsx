'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileInput } from '@/lib/validations/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateProfile } from './actions'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  initialData: ProfileInput & {
    id: string
    auth_id: string
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ...initialData,
      shift_pattern: initialData.shift_pattern,
      preferred_shift_category: initialData.preferred_shift_category,
    },
  })

  // Register select fields with react-hook-form
  useEffect(() => {
    register('shift_pattern')
    register('preferred_shift_category')
  }, [register])

  async function onSubmit(data: ProfileInput): Promise<void> {
    try {
      const result = await updateProfile({
        ...data,
        id: initialData.id,
        auth_id: initialData.auth_id,
      })

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Your profile has been updated successfully.',
      })

      reset(data)
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" role="form" aria-label="Profile form">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          disabled
          aria-describedby="email-error"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="first_name">First name</Label>
        <Input
          id="first_name"
          placeholder="First name"
          {...register('first_name')}
          disabled={isSubmitting}
          aria-describedby="first-name-error"
        />
        {errors.first_name && (
          <p id="first-name-error" className="text-sm text-red-500">
            {errors.first_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="last_name">Last name</Label>
        <Input
          id="last_name"
          placeholder="Last name"
          {...register('last_name')}
          disabled={isSubmitting}
          aria-describedby="last-name-error"
        />
        {errors.last_name && (
          <p id="last-name-error" className="text-sm text-red-500">
            {errors.last_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="shift_pattern">Shift pattern</Label>
        <Select
          defaultValue={initialData.shift_pattern}
          onValueChange={(value) => setValue('shift_pattern', value as ProfileInput['shift_pattern'])}
          disabled={isSubmitting}
        >
          <SelectTrigger
            id="shift_pattern"
            className="w-full"
            aria-describedby="shift-pattern-error"
          >
            <SelectValue placeholder="Select shift pattern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pattern_a">Pattern A (4x10)</SelectItem>
            <SelectItem value="pattern_b">Pattern B (3x12 + 1x4)</SelectItem>
          </SelectContent>
        </Select>
        {errors.shift_pattern && (
          <p id="shift-pattern-error" className="text-sm text-red-500">
            {errors.shift_pattern.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_shift_category">Preferred shift</Label>
        <Select
          defaultValue={initialData.preferred_shift_category}
          onValueChange={(value) => setValue('preferred_shift_category', value as ProfileInput['preferred_shift_category'])}
          disabled={isSubmitting}
        >
          <SelectTrigger
            id="preferred_shift_category"
            className="w-full"
            aria-describedby="shift-category-error"
          >
            <SelectValue placeholder="Select preferred shift" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day Shift</SelectItem>
            <SelectItem value="swing">Swing Shift</SelectItem>
            <SelectItem value="graveyard">Graveyard Shift</SelectItem>
          </SelectContent>
        </Select>
        {errors.preferred_shift_category && (
          <p id="shift-category-error" className="text-sm text-red-500">
            {errors.preferred_shift_category.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          defaultValue={initialData.role}
          disabled
        >
          <SelectTrigger id="role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dispatcher">Dispatcher</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Updating...' : 'Update profile'}
      </Button>
    </form>
  )
}
