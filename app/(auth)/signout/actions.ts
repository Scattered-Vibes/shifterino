'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Server action to handle user sign out from the 911 Dispatch Center application
 * Clears the Supabase authentication session and redirects to login page
 * 
 * Features:
 * - Cleans up Supabase auth session
 * - Revalidates all pages using root layout
 * - Redirects to login page
 * - Handles errors with detailed messages
 * 
 * @throws {Error} If sign out operation fails
 * @throws {Error} Original error if it's a Next.js redirect
 * 
 * @example
 * ```tsx
 * // In a client component:
 * <form action={signOut}>
 *   <button type="submit">Sign Out</button>
 * </form>
 * ```
 */
export async function signOut() {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Signout error:', error)
      throw error
    }
    
    revalidatePath('/', 'layout')
    redirect('/login')
  } catch (error) {
    // Rethrow redirect errors
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    
    if (error instanceof Error) {
      throw new Error(`Failed to sign out: ${error.message}`)
    }
    throw error
  }
} 