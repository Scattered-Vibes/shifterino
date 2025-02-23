'use server'

import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getServerClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/index'
import { ShiftSwapsDataTable } from './data-table'
import { CalendarView } from './calendar-view'
import { ShiftSwapsTableSkeleton } from './loading'
import type { Database } from '@/types/supabase/database'

type Employee = Database['public']['Tables']['employees']['Row']
type IndividualShift = Database['public']['Tables']['individual_shifts']['Row']
type ShiftOption = Database['public']['Tables']['shift_options']['Row']

type ShiftSwapRequest = Database['public']['Tables']['shift_swap_requests']['Row'] & {
  requester: Employee
  requested_employee: Employee
  original_shift: IndividualShift & {
    shift_option: ShiftOption
  }
  proposed_shift: IndividualShift & {
    shift_option: ShiftOption
  }
}

async function getShiftSwapRequests(): Promise<ShiftSwapRequest[]> {
  const supabase = getServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect('/login')
  }

  // Get user's role
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .single()

  if (employeeError) {
    throw employeeError
  }

  if (!employee || !['manager', 'supervisor'].includes(employee.role)) {
    redirect('/')
  }

  const { data, error } = await supabase
    .from('shift_swap_requests')
    .select(`
      *,
      requester:employees!shift_swap_requests_requester_id_fkey(*),
      requested_employee:employees!shift_swap_requests_requested_employee_id_fkey(*),
      original_shift:individual_shifts!shift_swap_requests_original_shift_id_fkey(
        *,
        shift_option:shift_options(*)
      ),
      proposed_shift:individual_shifts!shift_swap_requests_proposed_shift_id_fkey(
        *,
        shift_option:shift_options(*)
      )
    `)
    .order('created_at', { ascending: false })
    .returns<ShiftSwapRequest[]>()

  if (error) {
    throw error
  }

  return data
}

export default async function ShiftSwapsPage() {
  const dataPromise = getShiftSwapRequests().catch(handleError)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Shift Swaps</h2>
        <p className="text-muted-foreground">
          Manage shift swap requests between employees.
        </p>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <Suspense fallback={<ShiftSwapsTableSkeleton />}>
            <ShiftSwapsDataTable promise={dataPromise} />
          </Suspense>
        </TabsContent>
        <TabsContent value="calendar" className="space-y-4">
          <Suspense fallback={<ShiftSwapsTableSkeleton />}>
            <CalendarViewClient promise={dataPromise} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function CalendarViewClient({ 
  promise 
}: { 
  promise: Promise<ShiftSwapRequest[]> 
}) {
  const data = await promise
  return <CalendarView data={data} />
} 