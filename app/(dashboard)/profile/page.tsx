import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/server'
import { ProfileForm } from './profile-form'
import { PasswordForm } from './password-form'
import { ProfileSkeleton } from './loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Database } from '@/types/supabase/database'

type Employee = Database['public']['Tables']['employees']['Row']

async function getProfileData() {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) redirect('/login')

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (employeeError) throw employeeError
  if (!employee) throw new Error('Employee not found')

  return {
    user,
    employee,
  }
}

export default async function ProfilePage() {
  const { user, employee } = await getProfileData()

  return (
    <div className="container max-w-2xl space-y-8 pt-8">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Separator />

      <Suspense fallback={<ProfileSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} employee={employee} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  )
}
