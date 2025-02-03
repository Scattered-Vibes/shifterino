'use client'

/**
 * CompleteProfilePage component
 *
 * This component renders a form for users to complete their profile by providing additional information
 * such as their first name, last name, and preferred shift pattern. Upon form submission, it creates an employee record
 * in the Supabase database. If the user is not authenticated or an error occurs during the process,
 * appropriate error handling is performed and the user is redirected if necessary.
 *
 * @component
 * @returns {JSX.Element} The rendered CompleteProfilePage component.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

export default function CompleteProfilePage() {
  // Manage error messages and loading state
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Initialize the Supabase client instance
  const supabase = createClient()

  /**
   * Handles the submission of the complete profile form.
   *
   * This function retrieves the current user from Supabase. If the user is authenticated,
   * it gathers the form data and attempts to create a new employee record in the database.
   * In case of any issues, such as an inability to retrieve the user or record creation errors,
   * appropriate error messages are logged and displayed.
   *
   * @param {FormData} formData - The form data containing user profile fields.
   * @returns {Promise<void>} A promise that resolves when the profile submission is complete.
   */
  async function handleSubmit(formData: FormData): Promise<void> {
    try {
      setError(null)
      setLoading(true)

      // Retrieve current authenticated user from Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('Complete Profile - Current user:', user?.id)
      
      if (userError) {
        console.error('Complete Profile - User fetch error:', userError)
        throw userError
      }

      // Redirect to login if no authenticated user is found
      if (!user) {
        console.log('Complete Profile - No user found, redirecting to login')
        router.push('/login')
        return
      }

      // Prepare employee record data from form fields
      const employeeData = {
        auth_id: user.id,
        first_name: formData.get('firstName'),
        last_name: formData.get('lastName'),
        email: user.email,
        role: 'dispatcher',
        shift_pattern: formData.get('shiftPattern'),
        weekly_hours_cap: 40
      }
      console.log('Complete Profile - Attempting to create employee record:', employeeData)

      // Insert the new employee record into the "employees" table
      const { error: employeeError } = await supabase
        .from('employees')
        .insert(employeeData)

      if (employeeError) {
        console.error('Complete Profile - Employee creation error:', employeeError)
        throw employeeError
      }

      console.log('Complete Profile - Employee record created successfully')
      router.push('/dashboard')
    } catch (err) {
      console.error('Complete Profile - Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide some additional information to complete your profile
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
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}