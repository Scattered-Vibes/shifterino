'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'

interface ProfileFormProps {
  initialData: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleAuthChange = useCallback(async (event: string) => {
    if (event === 'SIGNED_OUT') {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, handleAuthChange])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    try {
      // First update the profile in the database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.get('first_name'),
          last_name: formData.get('last_name'),
          updated_at: new Date().toISOString()
        })
        .eq('id', initialData.id)

      if (profileError) throw profileError

      // Then update the user metadata to remove the profile_incomplete flag
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          profile_incomplete: false,
          first_name: formData.get('first_name'),
          last_name: formData.get('last_name')
        }
      })

      if (metadataError) throw metadataError

      toast({
        title: 'Profile updated',
        description: 'Your profile has been completed successfully.'
      })
      
      // Force a refresh to update the UI and trigger the auth state change
      router.refresh()
      
      // Redirect to the appropriate dashboard
      const { data: { user } } = await supabase.auth.getUser()
      const defaultRoute = user?.user_metadata?.role === 'supervisor' 
        ? '/manage' 
        : '/overview'
      router.push(defaultRoute)
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive'
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
        <Input 
          id="email" 
          name="email" 
          value={initialData.email}
          disabled 
        />
      </div>
      <Button type="submit">Complete Profile</Button>
    </form>
  )
} 