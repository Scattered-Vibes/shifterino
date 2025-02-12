'use client'

import { useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons'
import type { Database } from '@/types/supabase/database'

type ShiftSwapRequest = Database['public']['Tables']['shift_swap_requests']['Row'] & {
  requester: Database['public']['Tables']['employees']['Row']
  requested_employee: Database['public']['Tables']['employees']['Row']
  original_shift: Database['public']['Tables']['individual_shifts']['Row'] & {
    shift_option: Database['public']['Tables']['shift_options']['Row']
  }
  proposed_shift: Database['public']['Tables']['individual_shifts']['Row'] & {
    shift_option: Database['public']['Tables']['shift_options']['Row']
  }
}

const getStatusBadgeVariant = (status: Database['public']['Enums']['time_off_status']) => {
  switch (status) {
    case 'approved':
      return 'default'
    case 'rejected':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function formatShiftTime(shift: ShiftSwapRequest['original_shift']) {
  return `${format(new Date(shift.date), 'MMM d')} - ${format(
    new Date(`2000-01-01T${shift.shift_option.start_time}`),
    'h:mm a'
  )} to ${format(new Date(`2000-01-01T${shift.shift_option.end_time}`), 'h:mm a')}`
}

function ActionCell({ request }: { request: ShiftSwapRequest }) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const { toast } = useToast()

  if (request.status !== 'pending') {
    return null
  }

  async function handleAction(approve: boolean) {
    try {
      if (approve) {
        setIsApproving(true)
      } else {
        setIsRejecting(true)
      }

      const supabase = createClient()

      // Check for conflicts
      const { data: conflicts, error: conflictError } = await supabase
        .rpc('validate_swap_conflicts', {
          p_swap_request_id: request.id
        })

      if (conflictError) throw conflictError

      if (conflicts && conflicts.length > 0) {
        toast({
          title: 'Cannot Approve Swap',
          description: 'There are scheduling conflicts that prevent this swap.',
          variant: 'destructive',
        })
        return
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('shift_swap_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id)

      if (updateError) throw updateError

      // If approved, perform the swap
      if (approve) {
        const { error: swapError } = await supabase
          .rpc('execute_shift_swap', {
            p_swap_request_id: request.id
          })

        if (swapError) throw swapError
      }

      toast({
        title: approve ? 'Swap Approved' : 'Swap Rejected',
        description: `The shift swap request has been ${approve ? 'approved' : 'rejected'}.`,
      })

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to process the swap request. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsApproving(false)
      setIsRejecting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            className="h-8"
            disabled={isApproving || isRejecting}
          >
            <CheckIcon className="mr-2 h-4 w-4" />
            Approve
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Shift Swap</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this shift swap? This action will
              swap the shifts between the employees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction(true)}>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={isApproving || isRejecting}
          >
            <Cross2Icon className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Shift Swap</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this shift swap request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleAction(false)}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const columns: ColumnDef<ShiftSwapRequest>[] = [
  {
    accessorKey: 'requester',
    header: 'Requesting Employee',
    cell: ({ row }) => {
      const employee = row.original.requester
      return (
        <div>
          <div className="font-medium">
            {employee.first_name} {employee.last_name}
          </div>
          <div className="text-sm text-muted-foreground">{employee.email}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'original_shift',
    header: 'Original Shift',
    cell: ({ row }) => {
      const shift = row.original.original_shift
      return (
        <div>
          <div className="font-medium">{formatShiftTime(shift)}</div>
          <div className="text-sm text-muted-foreground">
            {shift.shift_option.category}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'requested_employee',
    header: 'Requested Employee',
    cell: ({ row }) => {
      const employee = row.original.requested_employee
      return (
        <div>
          <div className="font-medium">
            {employee.first_name} {employee.last_name}
          </div>
          <div className="text-sm text-muted-foreground">{employee.email}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'proposed_shift',
    header: 'Proposed Shift',
    cell: ({ row }) => {
      const shift = row.original.proposed_shift
      return (
        <div>
          <div className="font-medium">{formatShiftTime(shift)}</div>
          <div className="text-sm text-muted-foreground">
            {shift.shift_option.category}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
    },
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionCell request={row.original} />,
  },
]

interface DataTableProps {
  promise: Promise<ShiftSwapRequest[]>
}

export async function ShiftSwapsDataTable({ promise }: DataTableProps) {
  const data = await promise
  return <DataTable data={data} />
}

function DataTable({ data }: { data: ShiftSwapRequest[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filter by employee name..."
            value={(table.getColumn('requester')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('requester')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Input
            placeholder="Filter by status..."
            value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('status')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No shift swap requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
} 