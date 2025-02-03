'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { signup } from './actions'
import { useState } from 'react'

/**
 * SignUpPage Component
 * 
 * A client-side component that handles user registration for the 911 Dispatch Center.
 * Provides a form for collecting user information and handles the signup process.
 * 
 * Features:
 * - Collects user's first name, last name, email, password
 * - Allows selection of preferred shift pattern (Pattern A or B)
 * - Handles form submission and displays loading/error states
 * - Provides navigation to login page for existing users
 * 
 * @component
 * @example
 * ```tsx
 * <SignUpPage />
 * ```
 */
export default function SignUpPage() {
  // State for handling error messages and loading state
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * Handles the form submission for user signup
   * 
   * @param {FormData} formData - Form data containing user registration information
   * @property {string} formData.firstName - User's first name
   * @property {string} formData.lastName - User's last name
   * @property {string} formData.email - User's email address
   * @property {string} formData.password - User's password
   * @property {string} formData.shiftPattern - User's preferred shift pattern
   */
  async function handleSubmit(formData: FormData) {
    try {
      setError(null)
      setLoading(true)
      await signup(formData)
    } catch (err: unknown) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during signup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>
            Create your account to join the 911 Dispatch Center
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiftPattern">Preferred Shift Pattern</Label>
              <Select name="shiftPattern" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pattern_a">Pattern A (4x10)</SelectItem>
                  <SelectItem value="pattern_b">Pattern B (3x12 + 4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <div className="text-sm text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 