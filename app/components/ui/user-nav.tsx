'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/app/providers/SupabaseContext'
import { signOut } from '@/lib/auth/actions'
import { useFormState, useFormStatus } from 'react-dom'
import { Icons } from '@/components/ui/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'

function SignOutButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      variant="ghost" 
      className="w-full justify-start"
      disabled={pending}
    >
      {pending ? (
        <>
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        'Sign out'
      )}
    </Button>
  )
}

export function UserNav() {
  const { user, employee, isLoading } = useSupabase()
  const [state, formAction] = useFormState(signOut, null)
  
  if (isLoading) {
    return (
      <div className="h-8 w-8 flex items-center justify-center">
        <Icons.spinner className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  if (!user || !employee) {
    return null
  }

  const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {employee.first_name} {employee.last_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
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
            <SignOutButton />
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 