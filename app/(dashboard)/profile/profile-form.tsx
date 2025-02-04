'use client'

import { useState, useTransition, useEffect } from 'react'
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

type Employee = {
  id: string
  auth_id: string
  first_name: string
  last_name: string
  email: string
  role: 'dispatcher' | 'supervisor' | 'manager'
  shift_pattern: 'pattern_a' | 'pattern_b'
  created_at: string
  updated_at: string
}

interface ProfileFormProps {
  initialData: Employee
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<Employee['role']>(initialData.role)
  const [shiftPattern, setShiftPattern] = useState<'pattern_a' | 'pattern_b'>(
    initialData.shift_pattern as 'pattern_a' | 'pattern_b'
  )
  const supabase = createClient()

  // Check if user is a manager from both DB and auth
  const [isManager, setIsManager] = useState(false)
  
  // Effect to check manager status
  useEffect(() => {
    async function checkManagerStatus() {
      const { data: { session } } = await supabase.auth.getSession()
      const isAuthManager = session?.user?.user_metadata?.role === 'manager'
      const isDbManager = initialData.role === 'manager'
      setIsManager(isAuthManager || isDbManager)
    }
    checkManagerStatus()
  }, [initialData.role])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const firstName = formData.get('first_name') as string
    const lastName = formData.get('last_name') as string

    try {
      // Update employee record
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          first_name: firstName,
          last_name: lastName,
          role: isManager ? role : initialData.role,
          shift_pattern: isManager ? shiftPattern : initialData.shift_pattern,
          updated_at: new Date().toISOString()
        })
        .eq('id', initialData.id)

      if (updateError) throw updateError

      // If user is a manager and role changed, update auth metadata
      if (isManager && (role !== initialData.role || shiftPattern !== initialData.shift_pattern)) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            role,
            first_name: firstName,
            last_name: lastName
          }
        })
        if (authError) throw authError
      }

      toast.success('Profile updated successfully')
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              defaultValue={initialData.first_name}
              required
              disabled={isLoading || isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={initialData.last_name}
              required
              disabled={isLoading || isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initialData.email}
            disabled
          />
          <p className="text-sm text-gray-500">
            Email cannot be changed. Contact your manager if you need to update your email.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as Employee['role'])}
            disabled={!isManager || isLoading || isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dispatcher">Dispatcher</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
          {!isManager && (
            <p className="text-sm text-gray-500">
              Role can only be changed by managers.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Shift Pattern</Label>
          <Select
            value={shiftPattern}
            onValueChange={(value) => setShiftPattern(value as 'pattern_a' | 'pattern_b')}
            disabled={!isManager || isLoading || isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a shift pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pattern_a">Pattern A (4x10)</SelectItem>
              <SelectItem value="pattern_b">Pattern B (3x12 + 1x4)</SelectItem>
            </SelectContent>
          </Select>
          {!isManager && (
            <p className="text-sm text-gray-500">
              Shift pattern can only be changed by managers.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || isPending}>
          {isLoading ? 'Saving...' : isPending ? 'Updating...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
} 