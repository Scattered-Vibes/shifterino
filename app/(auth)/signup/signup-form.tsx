'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { signup } from '../actions'

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)

    try {
      const result = await signup(formData)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      // Redirect will happen in server action
      toast.success('Account created successfully! Please check your email.')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <form action={handleSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <RadioGroup name="role" defaultValue="dispatcher" required>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="dispatcher"
                  id="dispatcher"
                  disabled={isLoading}
                />
                <Label htmlFor="dispatcher">Dispatcher</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="supervisor"
                  id="supervisor"
                  disabled={isLoading}
                />
                <Label htmlFor="supervisor">Supervisor</Label>
              </div>
            </RadioGroup>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </form>
      <Button
        variant="link"
        className="px-0 font-normal"
        onClick={() => router.push('/login')}
      >
        Already have an account? Sign in
      </Button>
    </div>
  )
}
