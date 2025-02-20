import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { CompleteProfileForm } from './complete-profile-form'
import { requireAuth } from '@/lib/auth/server'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { DashboardError } from '@/components/ui/errors'
import DashboardLoading from '@/app/(dashboard)/loading'

export default async function CompleteProfilePage() {
  const auth = await requireAuth(true) // Allow incomplete profiles
  
  // If profile is already complete, redirect to overview
  if (auth.isComplete) {
    redirect('/overview')
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <ErrorBoundary fallback={<DashboardError title="Error" message="Failed to load profile form" />}>
          <Suspense fallback={<DashboardLoading />}>
            <CompleteProfileForm />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
} 