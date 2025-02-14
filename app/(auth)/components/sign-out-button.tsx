'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/app/hooks/use-auth'

export function SignOutButton() {
  const router = useRouter()
  const { toast } = useToast()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
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