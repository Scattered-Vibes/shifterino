import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

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
    // Validate user authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Authentication error:', userError)
      throw new Error('Authentication failed: ' + userError.message)
    }

    if (!user) {
      return redirect('/login')
    }

    console.log('Current user role:', user.user_metadata.role)

    // Get user's employee data with proper error handling
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', user.id)
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
    if (user.user_metadata.role !== employee.role) {
      console.log('Role mismatch detected. Syncing...')
      console.log('Auth role:', user.user_metadata.role)
      console.log('DB role:', employee.role)

      const { data: updateData, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            role: employee.role,
            // Preserve other metadata
            email: user.email,
            email_verified: user.user_metadata.email_verified,
            first_name: employee.first_name,
            last_name: employee.last_name,
            phone_verified: user.user_metadata.phone_verified,
          },
        })

      if (updateError) {
        console.error('Failed to sync role:', updateError)
        // Continue showing the profile, but log the error
      } else {
        console.log('Role sync successful')
        console.log('New auth metadata:', updateData.user.user_metadata)

        // Validate the update was successful
        const {
          data: { user: refreshedUser },
          error: refreshError,
        } = await supabase.auth.getUser()

        if (refreshError) {
          console.error('Failed to refresh user:', refreshError)
        } else if (refreshedUser?.user_metadata.role !== employee.role) {
          console.log('User refresh needed')
          return redirect('/profile')
        }
      }
    }

    return (
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-2xl font-bold">Profile Settings</h1>
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
