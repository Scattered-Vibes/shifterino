'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { signOut } from '../../app/(auth)/actions'

export function SignOutButton() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      const result = await signOut()
      
      if (result?.error) {
        throw new Error(result.error)
      }

      // No need for router.refresh() or router.push()
      // The server action handles the redirect

    } catch (error) {
      console.error('Sign out error:', error)
      toast({
        title: 'Error signing out',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  )
}
