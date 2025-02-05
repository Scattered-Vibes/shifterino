'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from './actions'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  async function handleLogin(formData: FormData) {
    try {
      setIsLoading(true)
      setError(null)
      await login(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-8 bg-white px-6 py-8 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <form action={handleLogin} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-500 text-center">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            required
            disabled={isLoading}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            disabled={isLoading}
            className="w-full"
          />
        </div>
        <input type="hidden" name="returnTo" value={returnTo ?? ''} />
        <Button 
          className="w-full" 
          type="submit"
          disabled={isLoading}
          aria-disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  )
} 