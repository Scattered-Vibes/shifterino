'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Employee = Database['public']['Tables']['employees']['Insert']

interface ProfileFormProps {
  user: {
    id: string
    email?: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<Employee['role']>()
  const [shiftPattern, setShiftPattern] = useState<'pattern_a' | 'pattern_b'>()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string

    if (!role) {
      toast.error('Please select a role')
      setIsLoading(false)
      return
    }

    if (!shiftPattern) {
      toast.error('Please select a shift pattern')
      setIsLoading(false)
      return
    }

    if (!user.email) {
      toast.error('User email is required')
      setIsLoading(false)
      return
    }

    const employeeData = {
      auth_id: user.id,
      first_name: firstName,
      last_name: lastName,
      role: role,
      email: user.email,
      shift_pattern: shiftPattern,
    }
    console.log('Submitting employee data:', employeeData)

    try {
      // First check if employee record already exists
      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select()
        .eq('auth_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no record found, which is what we want
        console.error('Error checking for existing employee:', checkError)
        throw checkError
      }

      let result
      if (existingEmployee) {
        console.log('Found existing employee record:', existingEmployee)
        
        // Check if the existing record is incomplete (missing required fields)
        if (!existingEmployee.first_name || !existingEmployee.last_name) {
          // Update the existing record
          const { data, error } = await supabase
            .from('employees')
            .update(employeeData)
            .eq('id', existingEmployee.id)
            .select()
            .single()
            
          if (error) throw error
          result = data
          toast.success('Profile updated successfully')
        } else {
          // Profile is already complete
          toast.error('Profile already exists and is complete')
          startTransition(() => {
            router.push('/dashboard')
          })
          return
        }
      } else {
        // Create new employee record
        const { data, error } = await supabase
          .from('employees')
          .insert(employeeData)
          .select()
          .single()

        if (error) throw error
        result = data
        toast.success('Profile completed successfully')
      }

      console.log('Operation successful:', result)
      startTransition(() => {
        router.push('/dashboard')
      })
    } catch (err) {
      console.error('Error completing profile:', err)
      if (err instanceof Error) {
        toast.error(err.message)
      } else if (typeof err === 'object' && err !== null) {
        console.error('Full error object:', JSON.stringify(err, null, 2))
        toast.error('Failed to complete profile. Please check the console for details.')
      } else {
        toast.error('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Debug log when component mounts
  console.log('ProfileForm mounted with user:', user)

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            required
            className="mt-1"
            disabled={isLoading || isPending}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            required
            className="mt-1"
            disabled={isLoading || isPending}
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select
            value={role}
            onValueChange={(value) => {
              console.log('Selected role:', value)
              setRole(value as Employee['role'])
            }}
            disabled={isLoading || isPending}
            required
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dispatcher">Dispatcher</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="shiftPattern">Shift Pattern</Label>
          <Select
            value={shiftPattern}
            onValueChange={(value) => {
              console.log('Selected shift pattern:', value)
              setShiftPattern(value as 'pattern_a' | 'pattern_b')
            }}
            disabled={isLoading || isPending}
            required
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a shift pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pattern_a">Pattern A (4x10)</SelectItem>
              <SelectItem value="pattern_b">Pattern B (3x12 + 1x4)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || isPending}
      >
        {isLoading ? 'Completing Profile...' : isPending ? 'Redirecting...' : 'Complete Profile'}
      </Button>
    </form>
  )
} 