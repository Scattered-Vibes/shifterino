'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import type { Database } from '@/app/types/supabase/database'

type Employee = Database['public']['Tables']['employees']['Row']

interface ProfileFormProps {
  initialData: {
    id: string
    auth_id: string
    first_name: string
    last_name: string
    email: string
    role: Employee['role']
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleAuthChange = useCallback(
    async (event: string) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    },
    [router]
  )

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange)
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, handleAuthChange])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    try {
      // Update the employee record in the database
      const { error: employeeError } = await supabase
        .from('employees')
        .update({
          first_name: formData.get('first_name')?.toString() || '',
          last_name: formData.get('last_name')?.toString() || '',
          updated_at: new Date().toISOString(),
        })
        .eq('auth_id', initialData.auth_id)

      if (employeeError) throw employeeError

      // Update the user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          first_name: formData.get('first_name')?.toString() || '',
          last_name: formData.get('last_name')?.toString() || '',
        },
      })

      if (metadataError) throw metadataError

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })

      // Force a refresh to update the UI
      router.refresh()

      // Redirect to the appropriate dashboard
      router.push(initialData.role === 'supervisor' ? '/manage' : '/overview')
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" value={initialData.email} disabled />
      </div>
      <Button type="submit">Update Profile</Button>
    </form>
  )
}
