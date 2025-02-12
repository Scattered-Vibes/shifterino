'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/app/providers/supabase-provider'
import { useToast } from '@/components/ui/use-toast'

export function SignOutButton() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast({
          title: 'Error signing out',
          description: error.message,
          variant: 'destructive',
        })
        return
      }
      
      router.push('/login')
      router.refresh()
    } catch {
      toast({
        title: 'Error signing out',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
      className="text-sm font-medium text-muted-foreground hover:text-primary"
    >
      Sign Out
    </Button>
  )
} 