'use client'

import { SideNav } from '@/components/ui/side-nav'
import type { Database } from '@/types/database'

type EmployeeRole = Database['public']['Tables']['employees']['Row']['role']

import { signOut } from '@/app/(auth)/signout/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface LayoutShellProps {
  children: React.ReactNode
  role?: EmployeeRole
}

export function LayoutShell({ children, role }: LayoutShellProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      // The server action handles the redirect
    } catch (error) {
      console.error('Error signing out:', error)
      
      // Only handle non-redirect errors
      if (error instanceof Error && error.message !== 'NEXT_REDIRECT') {
        if (error.message === 'SIGNOUT_FAILED') {
          router.replace('/login?error=signout_failed')
        } else {
          router.replace('/login')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background z-10">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <div className="flex-1">
            <h1 className="text-xl font-bold">Shifterino</h1>
          </div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            disabled={isLoading}
            className="text-sm font-medium hover:text-accent-foreground"
          >
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <SideNav role={role} />
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 