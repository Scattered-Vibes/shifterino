'use client';

import { createBrowserClient } from '@supabase/ssr'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SupabaseClient, User, AuthChangeEvent } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { useToast } from '@/components/ui/use-toast'

type SupabaseContext = {
  supabase: SupabaseClient<Database>
  user: User | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const [supabase] = useState(() =>
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/login')
        return
      }

      if (session?.user) {
        try {
          // Verify user exists in auth
          const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !verifiedUser) {
            console.error('User verification failed:', userError)
            await supabase.auth.signOut()
            router.push('/login')
            return
          }

          // Only check for employee record if not signing up
          if (event !== 'SIGNED_UP') {
            const { data: employee, error: employeeError } = await supabase
              .from('employees')
              .select('id')
              .eq('auth_id', verifiedUser.id)
              .maybeSingle()

            if (employeeError) {
              console.error('Error verifying employee:', employeeError)
              toast({
                title: 'Error',
                description: 'There was an error verifying your account. Please try signing in again.',
                variant: 'destructive',
              })
              await supabase.auth.signOut()
              router.push('/login')
              return
            }

            if (!employee) {
              router.push('/complete-profile')
              return
            }
          }

          setUser(verifiedUser)
        } catch (error) {
          console.error('Error in auth state change:', error)
          toast({
            title: 'Error',
            description: 'An unexpected error occurred. Please try again.',
            variant: 'destructive',
          })
          await supabase.auth.signOut()
          router.push('/login')
          return
        }
      } else {
        setUser(null)
      }

      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, toast])

  return (
    <Context.Provider value={{ supabase, user }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 