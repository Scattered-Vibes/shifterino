import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SupabaseProvider } from '@/app/providers/SupabaseContext'
import type { Database } from '@/types/supabase/database'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import '@/app/globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

async function getInitialData() {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    // Parallel fetch of user and employee data
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) throw userError
    
    if (user) {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (employeeError && employeeError.code !== 'PGRST116') {
        console.error('Error fetching employee:', employeeError)
      }

      return { user, employee: employee || null }
    }

    return { user: null, employee: null }
  } catch (error) {
    console.error('Error in getInitialData:', error)
    return { user: null, employee: null }
  }
}

export const metadata = {
  title: '911 Dispatch Scheduler',
  description: '24/7 Dispatch Center Scheduling System',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialData = await getInitialData()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background antialiased', inter.className)}>
        <SupabaseProvider initialData={initialData}>
          <Toaster />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}
