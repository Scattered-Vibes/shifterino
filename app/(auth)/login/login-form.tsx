'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from './actions'
import { useState } from 'react'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(formData: FormData) {
    try {
      setError(null)
      await login(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
    }
  }

  return (
    <div className="mt-8 bg-white px-6 py-8 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <form action={handleLogin} className="space-y-4">
        {error && (
          <div className="text-sm text-red-500 text-center">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            placeholder="Enter your email"
            required
            type="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            placeholder="Enter your password"
            required
            type="password"
          />
        </div>
        <Button className="w-full" type="submit">
          Sign In
        </Button>
      </form>
    </div>
  )
} 