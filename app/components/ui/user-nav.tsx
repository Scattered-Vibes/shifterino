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
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { toast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

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

function UserAvatar({ initials, name }: { initials: string; name?: string }) {
  return (
    <Avatar className="h-8 w-8">
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}

function LoadingAvatar() {
  return (
    <div className="h-8 w-8" aria-label="Loading profile">
      <Skeleton className="h-full w-full rounded-full" />
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="w-auto">
      <AlertDescription className="flex items-center gap-2">
        <span>Failed to load profile: {error.message}</span>
        <Button 
          variant="link" 
          className="h-auto p-0 text-foreground/80 hover:text-foreground"
          onClick={onRetry}
        >
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function IncompleteProfileAlert() {
  return (
    <Alert variant="default" className="w-auto">
      <AlertDescription className="flex items-center gap-2">
        <span>Please complete your profile to continue</span>
        <Link 
          href="/complete-profile" 
          className="font-medium underline hover:text-primary transition-colors"
        >
          Complete Profile
        </Link>
      </AlertDescription>
    </Alert>
  )
}

export function UserNav() {
  const { user, employee, isLoading, error, refreshEmployee } = useSupabase()
  const [state, formAction] = useFormState(signOut, null)
  const loadingStartTime = useRef<number | null>(null)
  
  useEffect(() => {
    if (isLoading && !loadingStartTime.current) {
      loadingStartTime.current = Date.now()
    } else if (!isLoading) {
      loadingStartTime.current = null
    }
  }, [isLoading])
  
  // Enhanced logging with timestamps and loading duration
  console.log('[UserNav] Render state:', { 
    hasUser: !!user, 
    hasEmployee: !!employee, 
    isLoading, 
    hasError: !!error,
    timestamp: new Date().toISOString(),
    errorDetails: error?.message,
    loadingDuration: loadingStartTime.current 
      ? `${Math.round((Date.now() - loadingStartTime.current) / 1000)}s`
      : null
  })

  // If no user, don't render anything
  if (!user) {
    return null
  }

  // Show minimal UI while loading
  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 rounded-full"
        disabled
      >
        <LoadingAvatar />
      </Button>
    )
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} onRetry={refreshEmployee} />
  }

  // Show incomplete profile alert
  if (!employee) {
    return <IncompleteProfileAlert />
  }

  const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase() || 'U'
  const fullName = `${employee.first_name} ${employee.last_name}`.trim()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full focus-visible:ring-offset-2"
          aria-label={`User menu for ${fullName}`}
        >
          <UserAvatar initials={initials} name={fullName} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {fullName}
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