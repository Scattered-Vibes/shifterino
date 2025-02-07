import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function OverviewPage() {
  const cookieStore = cookies()

  const supabase = createServerClient(
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Welcome back, {user?.user_metadata.first_name || user?.email}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Dispatcher Dashboard</div>
            <p className="text-xs text-muted-foreground">
              Manage your schedule and time off requests
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
