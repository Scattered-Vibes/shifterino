import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'

export default async function RequirementsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get user's role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/complete-profile')
  }

  // Only allow managers to access this route
  if (profile.role !== 'manager') {
    redirect('/unauthorized')
  }

  return <>{children}</>
} 