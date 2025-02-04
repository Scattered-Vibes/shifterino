'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { updateProfile } from './actions'

interface Employee {
  id: string
  auth_id: string
  first_name: string
  last_name: string
  email: string
  role: string
  shift_pattern: string
  profiles: {
    role: string
  }
}

interface ProfileFormProps {
  initialData: Employee
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    try {
      setIsLoading(true)
      await updateProfile(formData)
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              defaultValue={initialData.first_name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={initialData.last_name}
              required
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
          <Input
            value={initialData.profiles.role}
            disabled
          />
          <p className="text-sm text-gray-500">
            Role can only be changed by managers.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Shift Pattern</Label>
          <Input
            value={initialData.shift_pattern}
            disabled
          />
          <p className="text-sm text-gray-500">
            Shift pattern can only be changed by managers.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
} 