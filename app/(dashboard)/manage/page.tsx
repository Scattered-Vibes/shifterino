'use server'

import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import {
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  ArrowRightIcon,
  MobileIcon,
  PersonIcon,
  UpdateIcon,
} from '@radix-ui/react-icons'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

// Metric Card Component
function MetricCard({
  title,
  value,
  description,
  loading = false,
}: {
  title: string
  value: string | number
  description?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-[150px]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[100px]" />
          {description && <Skeleton className="mt-2 h-4 w-[200px]" />}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Quick Actions Section
function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/employees/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Employee
          </Link>
        </Button>
        <Button asChild>
          <Link href="/schedule/generate">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Generate Schedule
          </Link>
        </Button>
        <Button asChild>
          <Link href="/on-call/assign">
            <MobileIcon className="mr-2 h-4 w-4" />
            Assign On-Call
          </Link>
        </Button>
        <Button asChild>
          <Link href="/shifts/swap">
            <UpdateIcon className="mr-2 h-4 w-4" />
            Manage Swaps
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/time-off">
            <ClockIcon className="mr-2 h-4 w-4" />
            Review Time Off
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/employees">
            <PersonIcon className="mr-2 h-4 w-4" />
            Manage Staff
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// Pending Requests Section
async function PendingRequests() {
  const supabase = createClient()

  const [
    { data: timeOffRequests },
    { data: overtimeRequests },
    { data: swapRequests },
  ] = await Promise.all([
    supabase
      .from('time_off_requests')
      .select('*, employees(first_name, last_name)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('overtime_requests')
      .select('*, employees(first_name, last_name)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('shift_swap_requests')
      .select('*, employees(first_name, last_name)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Time Off Requests */}
          <div>
            <h3 className="text-lg font-semibold">Time Off</h3>
            <div className="mt-2 space-y-2">
              {timeOffRequests?.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {request.employees.first_name} {request.employees.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/time-off/${request.id}`}>
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Overtime Requests */}
          <div>
            <h3 className="text-lg font-semibold">Overtime</h3>
            <div className="mt-2 space-y-2">
              {overtimeRequests?.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {request.employees.first_name} {request.employees.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/overtime/${request.id}`}>
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Shift Swap Requests */}
          <div>
            <h3 className="text-lg font-semibold">Shift Swaps</h3>
            <div className="mt-2 space-y-2">
              {swapRequests?.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {request.employees.first_name} {request.employees.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/swaps/${request.id}`}>
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// On-Call Assignments Section
async function OnCallAssignments() {
  const supabase = createClient()
  
  const { data: onCallAssignments } = await supabase
    .from('on_call_assignments')
    .select('*, employees(first_name, last_name)')
    .gte('end_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>On-Call Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {onCallAssignments?.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">
                  {assignment.employees.first_name} {assignment.employees.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(assignment.start_time).toLocaleDateString()} - {new Date(assignment.end_time).toLocaleDateString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/on-call/${assignment.id}`}>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Metrics Section
async function Metrics() {
  const supabase = createClient()

  const [
    { data: totalHours },
    { data: overtimeHours },
    { data: staffingLevels },
    { data: pendingRequests },
  ] = await Promise.all([
    supabase.rpc('get_total_scheduled_hours'),
    supabase.rpc('get_total_overtime_hours'),
    supabase.rpc('get_current_staffing_levels'),
    supabase.rpc('get_pending_requests_count'),
  ])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Scheduled Hours"
        value={totalHours || 0}
        description="This week"
      />
      <MetricCard
        title="Overtime Hours"
        value={overtimeHours || 0}
        description="This week"
      />
      <MetricCard
        title="Current Staffing"
        value={`${staffingLevels?.current || 0}/${staffingLevels?.required || 0}`}
        description="Current shift"
      />
      <MetricCard
        title="Pending Requests"
        value={pendingRequests || 0}
        description="Across all categories"
      />
    </div>
  )
}

// Loading States
function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="" value="" loading />
        <MetricCard title="" value="" loading />
        <MetricCard title="" value="" loading />
        <MetricCard title="" value="" loading />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[200px]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Dashboard Page
export default async function ManagePage() {
  const supabase = createClient()

  try {
    // Verify authentication and role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw handleError(authError)
    }

    if (!user) {
      redirect('/login')
    }

    // Fetch user role
    const { data: userRole } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (!userRole || !['MANAGER', 'SUPERVISOR'].includes(userRole.role)) {
      redirect('/unauthorized')
    }

    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Management Dashboard</h1>
        <QuickActions />
        <ErrorBoundary>
          <Suspense fallback={<LoadingState />}>
            <Metrics />
          </Suspense>
        </ErrorBoundary>
        <div className="grid gap-6 md:grid-cols-2">
          <ErrorBoundary>
            <Suspense
              fallback={
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Skeleton className="h-6 w-[200px]" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <PendingRequests />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary>
            <Suspense
              fallback={
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Skeleton className="h-6 w-[200px]" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <OnCallAssignments />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    )
  } catch (error) {
    throw handleError(error)
  }
}
