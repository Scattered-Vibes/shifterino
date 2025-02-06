"use client"

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
import { useState } from 'react'
import Link from 'next/link'
import { signInWithEmail } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (isLoading) return
    
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await signInWithEmail(email, password)
      
      if (error) {
        throw error
      }

      // If we get here, auth was successful
      window.location.href = '/overview'
    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4" 
            method="POST"
            action="/overview"
          >
            {error && (
              <Alert variant="destructive">
                {error}
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link 
            href="/reset-password"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot your password?
          </Link>
          <div className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link 
              href="/signup"
              className="text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 