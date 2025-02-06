'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/(auth)/signout/actions'
import { useState } from 'react'

export function SignOutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignOut() {
    setIsLoading(true)
    try {
      await signOut()
      // The server action handles the redirect
    } catch (error) {
      console.error('Error during sign out:', error)
      
      // Only handle non-redirect errors
      if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
        if (error.message === 'SIGNOUT_FAILED') {
          // If the server action failed, try to gracefully degrade
          router.push('/login?error=signout_failed')
        } else {
          // For unknown errors, try to gracefully degrade
          router.push('/login')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleSignOut} 
      variant="destructive"
      disabled={isLoading}
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  )
} 