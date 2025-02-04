import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'

/**
 * ProfilePage Component
 * 
 * Displays and allows editing of the user's profile information.
 * Includes role-based access control to ensure users can only edit their own profiles
 * unless they are managers.
 */
export default async function ProfilePage() {
  const supabase = createClient()

  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Get user's profile and employee data
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select(`
      *,
      profiles (
        role
      )
    `)
    .eq('auth_id', session.user.id)
    .single()

  if (employeeError || !employee) {
    redirect('/complete-profile')
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <ProfileForm initialData={employee} />
        </div>
      </div>
    </div>
  )
} 