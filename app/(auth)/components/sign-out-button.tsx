'use client'

import { signOut } from '../actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

export function SignOutButton() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      const result = await signOut()
      
      if (result?.error) {
        toast({
          title: 'Error signing out',
          description: result.error,
          variant: 'destructive',
        })
        return
      }
      
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-medium text-muted-foreground hover:text-primary"
    >
      Sign Out
    </button>
  )
} 