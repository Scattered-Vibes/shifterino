'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { signOut } from '../actions'
import { getUserFriendlyMessage } from '@/lib/utils/error-handler'

export function SignOutButton() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      const result = await signOut()
      
      if (result?.error) {
        toast({
          title: 'Error signing out',
          description: result.code ? getUserFriendlyMessage({ message: result.error, code: result.code }) : result.error,
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