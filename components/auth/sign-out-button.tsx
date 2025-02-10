'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { ExitIcon } from '@radix-ui/react-icons'

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSignOut() {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw new Error(error.message)
      }
      
      router.push('/login')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: 'Error signing out',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenuItem
      className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
      disabled={isLoading}
      onClick={handleSignOut}
    >
      <ExitIcon className="mr-2 h-4 w-4" />
      <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
    </DropdownMenuItem>
  )
} 