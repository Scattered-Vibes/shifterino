'use client'

import { useSupabase } from '@/app/providers/SupabaseContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth/actions'
import { useFormState } from 'react-dom'
import { Icons } from '@/components/ui/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { UserRole } from '@/types/models/employee'

interface UserNavProps {
  name: string
  email: string
  role: UserRole
}

export function UserNav({ name, email, role }: UserNavProps) {
  const { user, employee, isLoading, error } = useSupabase()
  const [state, formAction] = useFormState(signOut, null)
  
  console.log('[UserNav] Render state:', { user: !!user, employee: !!employee, isLoading, error })
  
  if (isLoading) {
    return (
      <div className="h-8 w-8 flex items-center justify-center">
        <Icons.spinner className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  if (error) {
    console.error('[UserNav] Error:', error)
    return null
  }

  if (!user) {
    console.log('[UserNav] No user, returning null')
    return null
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.user_metadata?.avatar_url || ''} 
              alt={name} 
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
            <p className="text-xs leading-none text-muted-foreground capitalize">
              {role}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {state?.error && (
          <Alert variant="destructive" className="mb-2">
            <AlertDescription>
              {state.error.message}
            </AlertDescription>
          </Alert>
        )}
        <form action={formAction}>
          <DropdownMenuItem asChild>
            <Button 
              type="submit" 
              variant="ghost" 
              className="w-full justify-start"
            >
              Sign out
            </Button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
