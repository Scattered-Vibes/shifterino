import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserNav } from '@/components/ui/user-nav'
import { SideNav } from '@/components/ui/side-nav'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      redirect('/login')
    }

    // Get employee data
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    // Handle missing employee profile
    if (employeeError?.code === 'PGRST116' || !employee) {
      redirect('/complete-profile')
    }

    // Handle other database errors
    if (employeeError) {
      console.error('Error fetching employee data:', employeeError)
      throw new Error('Failed to fetch employee data')
    }

    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 border-b bg-background">
          <div className="container flex h-16 items-center px-4">
            <Link 
              href="/overview" 
              className="flex items-center space-x-2 font-bold text-xl hover:text-primary"
            >
              Shifterino
            </Link>
            <div className="ml-auto flex items-center space-x-4">
              <UserNav user={{ ...user, ...employee }} />
            </div>
          </div>
        </header>
        <div className="flex-1 container">
          <div className="flex-1 items-start md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
            <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
              <div className="py-6 pr-4 lg:py-8">
                <SideNav role={employee?.role} />
              </div>
            </aside>
            <main className="flex w-full flex-col overflow-hidden">
              <div className="flex-1 space-y-4 p-8">
                <Suspense fallback={<LoadingSpinner />}>
                  {children}
                </Suspense>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    redirect('/error?message=Something went wrong')
  }
}