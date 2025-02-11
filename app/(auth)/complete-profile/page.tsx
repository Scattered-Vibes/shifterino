import { redirect } from 'next/navigation'

import { requireAuth } from '@/app/lib/auth'
import { ProfileForm } from '@/components/profile/profile-form'

export default async function CompleteProfilePage() {
  console.log('Complete Profile Page: Starting')

  // Use requireAuth with allowIncomplete=true for this page
  const auth = await requireAuth(true)
  console.log('Complete Profile Page: Auth result', {
    userId: auth.userId,
    email: auth.email,
    role: auth.role,
    isNewUser: auth.isNewUser,
  })

  // If user already has a complete profile, redirect to dashboard
  if (!auth.isNewUser) {
    console.log(
      'Complete Profile Page: User has complete profile, redirecting to overview'
    )
    redirect('/overview')
  }

  console.log('Complete Profile Page: Rendering profile form for new user')
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Complete Your Profile
        </h1>
        <p className="mt-2 text-muted-foreground">
          Please provide your information to complete your profile.
        </p>
        <ProfileForm
          initialData={{
            id: auth.userId,
            auth_id: auth.userId,
            first_name: '',
            last_name: '',
            email: auth.email,
            role: auth.role,
          }}
        />
      </div>
    </div>
  )
}
