'use client'

import { useState } from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table as TableType,
} from '@tanstack/react-table'
import {
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
import { Button, type ButtonProps } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import type { Database } from '@/types/supabase/database'
import { useFormState, useFormStatus } from 'react-dom'
import { updateShift, updateBulkShifts } from '../actions/schedule'
import { Loader2 } from 'lucide-react'

type OvertimeRequest = Database['public']['Tables']['individual_shifts']['Row'] & {
  employees: Database['public']['Tables']['employees']['Row']
}

const getStatusBadgeVariant = (status: Database['public']['Enums']['shift_status']) => {
  switch (status) {
    case 'completed':
      return 'default'
    case 'cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function ActionButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus()
  
  return (
    <Button {...props} disabled={pending || props.disabled}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export function OvertimeDataTable({ promise }: { promise: Promise<OvertimeRequest[]> }) {
  const [data, setData] = useState<OvertimeRequest[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null)
  const { toast } = useToast()

  // Load data when promise resolves
  promise.then(setData).catch(error => {
    console.error("Failed to load overtime requests:", error)
    toast({
      title: "Error",
      description: "Failed to load overtime requests. Please try again.",
      variant: "destructive"
    })
  })

  const [updateState, updateAction] = useFormState(async (prevState: any, formData: FormData) => {
    try {
      const result = await updateShift(formData)
      if (result.error) throw result.error
      
      // Update local state
      const shiftId = formData.get('shiftId') as string
      const status = formData.get('status') as Database['public']['Enums']['shift_status']
      setData(data.map(request => 
        request.id === shiftId ? { ...request, status } : request
      ))
      
      toast({
        title: 'Success',
        description: `Shift marked as ${status}.`,
      })
      
      return { success: true }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update shift. Please try again.',
        variant: 'destructive',
      })
      return { error: error.message }
    }
  }, null)

  const [bulkUpdateState, bulkUpdateAction] = useFormState(async (prevState: any, formData: FormData) => {
    try {
      const selectedIds = Object.keys(rowSelection).map(
        index => data[parseInt(index)].id
      )
      
      formData.set('shiftIds', JSON.stringify(selectedIds))
      
      const result = await updateBulkShifts(formData)
      if (result.error) throw result.error
      
      // Update local state
      const status = formData.get('status') as Database['public']['Enums']['shift_status']
      setData(data.map(request => 
        selectedIds.includes(request.id) ? { ...request, status } : request
      ))
      setRowSelection({})
      
      toast({
        title: 'Success',
        description: `${selectedIds.length} shifts marked as ${status}.`,
      })
      
      return { success: true }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update shifts. Please try again.',
        variant: 'destructive',
      })
      return { error: error.message }
    }
  }, null)

  const columns: ColumnDef<OvertimeRequest>[] = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<OvertimeRequest> }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: { row: { getIsSelected: () => boolean; toggleSelected: (value: boolean) => void } }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'employees',
      header: 'Employee',
      cell: ({ row }: { row: { original: OvertimeRequest } }) => (
        <div>
          <div className="font-medium">
            {row.original.employees.first_name} {row.original.employees.last_name}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.employees.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }: { row: { original: OvertimeRequest } }) => format(new Date(row.original.date), 'MMM d, yyyy'),
    },
    {
      accessorKey: 'actual_hours_worked',
      header: 'Hours',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: OvertimeRequest } }) => {
        const status = row.original.status
        return (
          <Badge
            variant={getStatusBadgeVariant(status)}
          >
            {status.toUpperCase()}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: OvertimeRequest } }) => {
        const request = row.original
        
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRequest(request)}
            >
              View
            </Button>
            {request.status === 'scheduled' && (
              <>
                <form action={updateAction} className="inline-block">
                  <input type="hidden" name="shiftId" value={request.id} />
                  <input type="hidden" name="status" value="completed" />
                  <ActionButton
                    size="sm"
                    type="submit"
                  >
                    Complete
                  </ActionButton>
                </form>
                <form action={updateAction} className="inline-block">
                  <input type="hidden" name="shiftId" value={request.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <ActionButton
                    variant="outline"
                    size="sm"
                    type="submit"
                  >
                    Cancel
                  </ActionButton>
                </form>
              </>
            )}
          </div>
        )
      },
    },
  ]

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
        <Input
          placeholder="Filter employees..."
          value={(table.getColumn('employees')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('employees')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <>
              <form action={bulkUpdateAction}>
                <input type="hidden" name="status" value="completed" />
                <ActionButton
                  size="sm"
                >
                  Complete Selected
                </ActionButton>
              </form>
              <form action={bulkUpdateAction}>
                <input type="hidden" name="status" value="cancelled" />
                <ActionButton
                  variant="outline"
                  size="sm"
                >
                  Cancel Selected
                </ActionButton>
              </form>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
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
                  No results.
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
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Overtime Details</DialogTitle>
              <DialogDescription>
                View details for {selectedRequest.employees.first_name} {selectedRequest.employees.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Date</h4>
                <p>{format(new Date(selectedRequest.date), 'MMMM d, yyyy')}</p>
              </div>
              <div>
                <h4 className="font-medium">Hours Worked</h4>
                <p>{selectedRequest.actual_hours_worked}</p>
              </div>
              <div>
                <h4 className="font-medium">Status</h4>
                <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                  {selectedRequest.status.toUpperCase()}
                </Badge>
              </div>
              {selectedRequest.notes && (
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p>{selectedRequest.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 