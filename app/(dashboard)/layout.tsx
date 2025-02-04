import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientLayout } from '@/components/layout/client-layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, first_name, last_name, role')
    .eq('user_id', user.id)
    .single()

  if (!employee) {
    redirect('/profile/complete')
  }

  return <ClientLayout user={user} employee={employee}>{children}</ClientLayout>
}