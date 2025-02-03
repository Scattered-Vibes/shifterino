/**
 * Login page component for the 911 Dispatch Center application
 * Provides email/password authentication with error handling and loading states
 * 
 * Features:
 * - Email and password form inputs with validation
 * - Loading state during authentication
 * - Error display for failed login attempts
 * - Links to signup and password recovery
 * - Responsive layout with centered card design
 * 
 * @component
 * @example
 * ```tsx
 * <LoginPage />
 * ```
 */
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { login } from './actions'
import { useState } from 'react'

export default function LoginPage() {
  // Track error message state for failed login attempts
  const [error, setError] = useState<string | null>(null)
  // Track loading state during authentication
  const [loading, setLoading] = useState(false)

  /**
   * Handles form submission for login
   * Attempts to authenticate user and handles any errors
   * 
   * @param {FormData} formData - Form data containing email and password
   * @returns {Promise<void>}
   */
  async function handleSubmit(formData: FormData) {
    try {
      setError(null)
      setLoading(true)
      await login(formData)
    } catch (err: unknown) {
      // Ignore Next.js redirect errors but display other errors
      if (err instanceof Error && !err.message.includes('NEXT_REDIRECT')) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your 911 Dispatch Center schedule
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                autoComplete="email"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                autoComplete="current-password"
                required 
              />
            </div>
            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-sm text-center space-y-2">
              <div>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-blue-600 hover:underline">
                  Sign up
                </Link>
              </div>
              <div>
                <Link href="/forgot-password" className="text-gray-600 hover:underline">
                  Forgot your password?
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 