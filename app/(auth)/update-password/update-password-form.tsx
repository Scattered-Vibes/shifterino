'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updatePasswordSchema, type UpdatePasswordInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

import { updatePassword } from '../actions'

export function UpdatePasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  })

  async function onSubmit(data: UpdatePasswordInput) {
    try {
      const result = await updatePassword(data)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      // Redirect will be handled by the server action
      toast.success('Password updated successfully')
    } catch {
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            disabled={isSubmitting}
            aria-describedby="password-error"
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-500">
              {errors.password.message}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Password must be at least 8 characters long
          </p>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating password...' : 'Update password'}
        </Button>
      </form>
    </div>
  )
} 