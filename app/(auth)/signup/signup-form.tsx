'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupInput } from '@/lib/validations/schemas'
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
import { signup } from './actions'

export function SignupForm() {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  })

  // Watch the role field for validation
  const role = watch('role')

  async function onSubmit(data: SignupInput): Promise<void> {
    try {
      const result = await signup(data)
      
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
        description: 'Your account has been created. Please check your email to verify your account.',
      })
      
      // Redirect will be handled by the server action
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          {...register('email')}
          disabled={isSubmitting}
          aria-describedby="email-error"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
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
      </div>

      <div className="space-y-2">
        <Select
          onValueChange={(value) => setValue('role', value as SignupInput['role'])}
          defaultValue={role}
        >
          <SelectTrigger
            className="w-full"
            aria-describedby="role-error"
          >
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dispatcher">Dispatcher</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p id="role-error" className="text-sm text-red-500">
            {errors.role.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}
