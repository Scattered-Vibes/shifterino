import { redirect } from "next/navigation"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Home Page Component
 *
 * This is the landing page for the 911 Dispatch Scheduler application.
 * It checks if there is an authenticated user; if so, it redirects to the dashboard.
 * Otherwise, it renders the home page with options to log in or sign up.
 *
 * @returns {Promise<JSX.Element>} The home page UI for unauthenticated users,
 * or a redirection to the dashboard if the user is authenticated.
 */
export default async function Home() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/overview')
  }

  redirect('/login')
}
