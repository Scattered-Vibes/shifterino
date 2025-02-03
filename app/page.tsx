import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

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
  // Create a server-side Supabase client instance for authentication
  const supabase = await createClient()
  
  // Retrieve the current user's authentication status
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // If a user is authenticated and there are no errors, redirect to the dashboard
  if (user && !error) {
    redirect('/dashboard')
  }

  // Render the landing page for unauthenticated users
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                {/* Application title */}
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  911 Dispatch Scheduler
                </h1>
                {/* Brief description of the scheduling solution */}
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Streamline your emergency dispatch operations with our comprehensive scheduling solution.
                </p>
              </div>
              <div className="space-x-4">
                {/* Navigation button to the login page */}
                <Link href="/login">
                  <Button>Login</Button>
                </Link>
                {/* Navigation button to the sign-up page, styled as outlined */}
                <Link href="/signup">
                  <Button variant="outline">Sign Up</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-center py-6 border-t">
        {/* Footer content */}
        <p className="text-sm text-gray-500">© 2025 911 Dispatch Scheduler. All rights reserved.</p>
      </footer>
    </div>
  )
}
