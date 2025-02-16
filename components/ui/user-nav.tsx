'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/app/providers/SupabaseContext'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/use-toast'

function SignOutButton() {
  const { supabase } = useSupabase()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: 'Error signing out',
        description: 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenuItem 
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="cursor-pointer"
    >
      {isSigningOut ? (
        <Spinner className="mr-2 h-4 w-4" />
      ) : null}
      Sign out
    </DropdownMenuItem>
  )
}

export function UserNav() {
  const { user, employee, isLoading, error } = useSupabase()
  const router = useRouter()

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Button 
        variant="ghost" 
        onClick={() => router.push('/login')}
        className="text-red-500"
      >
        Error: Please login again
      </Button>
    )
  }

  // If no user or employee data, don't render anything
  if (!user || !employee) {
    return null
  }

  const fullName = `${employee.first_name} ${employee.last_name}`
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata.avatar_url} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push('/profile')}
          >
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push('/settings')}
          >
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <SignOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
