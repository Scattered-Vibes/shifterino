'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      // Clear any cached data
      router.refresh()
      
      // Redirect to login
      router.push('/login')
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
    >
      Sign Out
    </Button>
  )
} 