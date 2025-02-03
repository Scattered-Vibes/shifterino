import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutShell } from '@/components/ui/layout-shell'

/**
 * DashboardLayout Component
 *
 * This server component wraps the dashboard content. It ensures that the user is authenticated
 * and fetches the user's role from the 'employees' table in Supabase. Based on this information,
 * it renders the LayoutShell with role-specific enhancements.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child components to render inside the layout.
 * @returns {JSX.Element} The LayoutShell component configured for the current user's role.
 *
 * @example
 * <DashboardLayout>
 *   <DashboardContent />
 * </DashboardLayout>
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize Supabase client for server-side operations.
  const supabase = await createClient()

  // Retrieve the currently authenticated user.
  const { data: { user }, error } = await supabase.auth.getUser()

  // If there's an error or no user is authenticated, redirect to the login page.
  if (error || !user) {
    redirect('/login')
  }

  // Fetch the employee record to obtain the user's role from the 'employees' table.
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  // If no employee record exists (specific error code), render the layout without role-specific features.
  if (employeeError?.code === 'PGRST116') {
    return <LayoutShell>{children}</LayoutShell>
  }

  // For any other errors fetching the employee record, log the error and redirect to the login page.
  if (employeeError) {
    console.error('Failed to fetch employee role:', employeeError)
    redirect('/login')
  }

  // Render the LayoutShell with the user's role passed as a property.
  return <LayoutShell role={employee?.role}>{children}</LayoutShell>
}