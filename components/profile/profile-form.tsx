'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/hooks/useSupabase'
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
  const supabase = useSupabase()

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
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: initialData.first_name,
          last_name: initialData.last_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', initialData.id)

      if (error) throw error

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.'
      })
      
      router.refresh()
    } catch (error) {
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
      <Button type="submit">Update Profile</Button>
    </form>
  )
} 