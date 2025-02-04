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

    try {
      const supabase = createClient()
      const { error: upsertError } = await supabase
        .from('employees')
        .upsert(employeeData)
        .select()
        .single()

      if (upsertError) throw upsertError

      toast.success('Profile completed successfully')
      startTransition(() => {
        router.replace('/dashboard')
      })
    } catch (err) {
      console.error('Error completing profile:', err)
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('Failed to complete profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

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