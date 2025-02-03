 // Start of Selection
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Signs out the currently authenticated user.
 *
 * This server-side action creates a Supabase client, calls the signOut method to clear the user's session,
 * and then redirects the user to the login page. It ensures that server cookies and session data are updated accordingly.
 *
 * @async
 * @function signOut
 * @returns {Promise<void>} A promise that resolves once the sign-out is complete and redirection is triggered.
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}