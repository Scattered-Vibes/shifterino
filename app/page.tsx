import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Home Page Component
 *
 * This is the landing page for the 911 Dispatch Scheduler application.
 * It checks if there is an authenticated user; if so, it redirects to the dashboard.
 * Otherwise, it redirects to the login page.
 *
 * @returns {Promise<JSX.Element>} The home page UI for unauthenticated users,
 * or a redirection to the dashboard if the user is authenticated.
 */
export default async function RootPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string) {
          cookieStore.delete(name)
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
