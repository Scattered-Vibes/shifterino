'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/(auth)/signout/actions'
import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

export function UserNav() {
  const { profile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  if (!profile) return null

  const initials = profile.email
    .split('@')[0]
    .split('.')
    .map(n => n[0])
    .join('')
    .toUpperCase()

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled={isLoading}>
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.email.split('@')[0].replace('.', ' ')}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
            <p className="text-xs leading-none text-muted-foreground capitalize">{profile.role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 