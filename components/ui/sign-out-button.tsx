'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/AuthProvider'

export function SignOutButton() {
  const { signOut } = useAuth()

  return (
    <Button variant="ghost" onClick={() => signOut()}>
      Sign Out
    </Button>
  )
}
