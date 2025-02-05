import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/profile/profile-form'
import { requireAuth } from '@/lib/auth'

export default async function CompleteProfilePage() {
  console.log('Complete Profile Page: Starting')
  
  // Use requireAuth with allowIncomplete=true for this page
  const auth = await requireAuth(true)
  console.log('Complete Profile Page: Auth result', {
    userId: auth.userId,
    email: auth.email,
    role: auth.role,
    isNewUser: auth.isNewUser
  })
  
  // If user already has a complete profile, redirect to dashboard
  if (!auth.isNewUser) {
    console.log('Complete Profile Page: User has complete profile, redirecting to overview')
    redirect('/overview')
  }

  console.log('Complete Profile Page: Rendering profile form for new user')
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Complete Your Profile</h1>
        <p className="text-muted-foreground mt-2">
          Please provide your information to complete your profile.
        </p>
        <ProfileForm 
          user={{
            id: auth.userId,
            email: auth.email,
            role: auth.role
          }} 
        />
      </div>
    </div>
  )
}