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
import { getServerClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { Database } from '@/types/supabase/database'
import { Badge } from '@/components/ui/badge'

type Employee = Database['public']['Tables']['employees']['Row']
type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row'] & {
  employee: Employee
}
type ShiftSwapRequest = Database['public']['Tables']['shift_swap_requests']['Row'] & {
  requesting_employee: Employee
  receiving_employee: Employee
}
type SchedulingLog = Database['public']['Tables']['scheduling_logs']['Row'] & {
  employee: Employee
}

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
  const supabase = getServerClient()

  const { data: timeOffRequests } = await supabase
    .from('time_off_requests')
    .select(`
      *,
      employee:employees(*)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: shiftSwaps } = await supabase
    .from('shift_swap_requests')
    .select(`
      *,
      requesting_employee:employees!requesting_employee_id(*),
      receiving_employee:employees!receiving_employee_id(*)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: scheduleChanges } = await supabase
    .from('scheduling_logs')
    .select(`
      *,
      employee:employees(*)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

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
                      {request.employees?.first_name} {request.employees?.last_name}
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

          {/* Shift Swap Requests */}
          <div>
            <h3 className="text-lg font-semibold">Shift Swaps</h3>
            <div className="mt-2 space-y-2">
              {shiftSwaps?.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {request.requesting_employee.first_name} → {request.receiving_employee.first_name}
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

          {/* Schedule Changes */}
          <div>
            <h3 className="text-lg font-semibold">Schedule Changes</h3>
            <div className="mt-2 space-y-2">
              {scheduleChanges?.map((change) => (
                <div
                  key={change.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {change.employee.first_name} {change.employee.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(change.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/schedule-changes/${change.id}`}>
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
  const supabase = getServerClient()
  
  const { data: assignments } = await supabase
    .from('on_call_assignments')
    .select('*, employees!on_call_assignments_employee_id_fkey(first_name, last_name)')
    .gte('end_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(5)
    .then(res => ({ data: res.data as OnCallAssignment[] | null }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current On-Call</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments?.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">
                  {assignment.employees?.first_name} {assignment.employees?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(assignment.start_time), {
                    addSuffix: true,
                  })}
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
  const supabase = getServerClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/login')
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (employeeError) {
      console.error('Error fetching employee:', employeeError)
      redirect('/error')
    }

    if (!employee) {
      console.warn('No employee record found for user:', user.id)
      redirect('/complete-profile')
    }

    if (!['admin', 'manager', 'supervisor'].includes(employee.role)) {
      redirect('/unauthorized')
    }

    const [totalHoursResult, overtimeHoursResult] = await Promise.all([
      supabase.rpc('get_total_scheduled_hours', {
        employee_id: user.id,
        start_date: startOfMonth,
        end_date: endOfMonth,
      }),
      supabase.rpc('get_total_overtime_hours', {
        employee_id: user.id,
        start_date: startOfMonth,
        end_date: endOfMonth,
      }),
    ])

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Hours"
          value={totalHoursResult.data ?? 0}
          description="This month"
        />
        <MetricCard
          title="Overtime Hours"
          value={overtimeHoursResult.data ?? 0}
          description="This month"
        />
      </div>
    )
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return null
  }
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
  const supabase = getServerClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/login')
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (employeeError) {
      console.error('Error fetching employee:', employeeError)
      redirect('/error')
    }

    if (!employee) {
      console.warn('No employee record found for user:', user.id)
      redirect('/complete-profile')
    }

    if (!['admin', 'manager', 'supervisor'].includes(employee.role)) {
      redirect('/unauthorized')
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Management Dashboard</h1>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<LoadingState />}>
            <div className="grid gap-6">
              <Metrics />
              <QuickActions />
              <div className="grid gap-6 md:grid-cols-2">
                <PendingRequests />
                <OnCallAssignments />
              </div>
            </div>
          </Suspense>
        </ErrorBoundary>
      </div>
    )
  } catch (error) {
    console.error('Error in ManagePage:', error)
    redirect('/error')
  }
}
