import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/profile-form'

export default async function CompleteProfilePage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session?.user) {
    redirect('/login')
  }
  
  // Check if profile is already complete
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('first_name, last_name')
    .eq('auth_id', session.user.id)
    .single()
    
  if (!employeeError && employee?.first_name && employee?.last_name) {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Complete Your Profile</h1>
        <p className="text-muted-foreground mt-2">
          Please provide your information to complete your profile.
        </p>
        <ProfileForm user={session.user} />
      </div>
    </div>
  )
}