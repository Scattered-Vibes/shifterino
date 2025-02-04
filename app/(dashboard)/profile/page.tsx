import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './profile-form'

export const dynamic = 'force-dynamic'

/**
 * ProfilePage Component
 * 
 * Displays and allows editing of the user's profile information.
 * Includes role-based access control to ensure users can only edit their own profiles
 * unless they are managers.
 */
export default async function ProfilePage() {
  const supabase = createClient()

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      throw new Error('Authentication failed: ' + sessionError.message)
    }

    if (!session) {
      return redirect('/login')
    }

    console.log('Current session role:', session.user.user_metadata.role)

    // Get user's employee data with proper error handling
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', session.user.id)
      .single()

    if (employeeError) {
      console.error('Error fetching employee data:', employeeError)
      if (employeeError.code === 'PGRST116') {
        return redirect('/complete-profile')
      }
      throw new Error('Failed to load profile: ' + employeeError.message)
    }

    if (!employee) {
      return redirect('/complete-profile')
    }

    console.log('Database role:', employee.role)

    // Sync role with auth metadata if it's different
    if (session.user.user_metadata.role !== employee.role) {
      console.log('Role mismatch detected. Syncing...')
      console.log('Auth role:', session.user.user_metadata.role)
      console.log('DB role:', employee.role)

      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        data: { 
          role: employee.role,
          // Preserve other metadata
          email: session.user.email,
          email_verified: session.user.user_metadata.email_verified,
          first_name: employee.first_name,
          last_name: employee.last_name,
          phone_verified: session.user.user_metadata.phone_verified,
        }
      })

      if (updateError) {
        console.error('Failed to sync role:', updateError)
        // Continue showing the profile, but log the error
      } else {
        console.log('Role sync successful')
        console.log('New auth metadata:', updateData.user.user_metadata)
        
        // Force a new session to be fetched with updated metadata
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.getSession()
        
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError)
        } else if (newSession?.user.user_metadata.role !== employee.role) {
          console.log('Session refresh needed')
          return redirect('/profile')
        }
      }
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
  } catch (error) {
    console.error('Profile page error:', error)
    throw error instanceof Error ? error : new Error('Failed to load profile')
  }
} 