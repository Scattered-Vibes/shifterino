'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useSignOut } from '@/app/lib/hooks/use-auth-mutations'

export function SignOutButton() {
  const router = useRouter()
  const { toast } = useToast()
  const signOutMutation = useSignOut()

  const handleSignOut = async () => {
    try {
      const result = await signOutMutation.mutateAsync()
      if (result.error) throw result.error
      
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
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