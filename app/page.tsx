import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Auth error:', error)
    redirect('/login')
  }

  if (user) {
    // Get employee data to check if profile is complete
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('first_name, last_name, role')
      .eq('auth_id', user.id)
      .single()

    if (employeeError) {
      console.error('Error fetching employee data:', employeeError)
      redirect('/login')
    }

    // Redirect to complete profile if needed
    if (!employee?.first_name || !employee?.last_name) {
      redirect('/complete-profile')
    }

    // Redirect based on role
    redirect(employee.role === 'supervisor' ? '/manage' : '/overview')
  }

  redirect('/login')
}
