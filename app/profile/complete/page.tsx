import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/profile-form'

export default async function ProfileCompletePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if employee record already exists
  const { data: existingEmployee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // If employee record exists, redirect to dashboard
  if (existingEmployee) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please provide your information to complete your profile
          </p>
        </div>
        <ProfileForm user={user} />
      </div>
    </div>
  )
} 