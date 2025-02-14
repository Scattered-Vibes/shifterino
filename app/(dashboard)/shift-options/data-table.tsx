'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EditShiftOptionDialog } from './edit-dialog'
import { DeleteShiftOptionDialog } from './delete-dialog'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import type { Database } from '@/types/supabase/database'

type ShiftOption = Database['public']['Tables']['shift_options']['Row']

interface DataTableProps {
  options: ShiftOption[]
}

export function ShiftOptionsDataTable({ options }: DataTableProps) {
  const [editingOption, setEditingOption] = useState<ShiftOption | null>(null)
  const [deletingOption, setDeletingOption] = useState<ShiftOption | null>(null)

  return (
    <div className="relative">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map((option) => {
            // Parse times for display
            const startTime = new Date(`2000-01-01T${option.start_time}`)
            const endTime = new Date(`2000-01-01T${option.end_time}`)
            
            return (
              <TableRow key={option.id}>
                <TableCell>{option.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {option.category}
                  </Badge>
                </TableCell>
                <TableCell>{format(startTime, 'h:mm a')}</TableCell>
                <TableCell>{format(endTime, 'h:mm a')}</TableCell>
                <TableCell>{option.duration_hours} hours</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <DotsHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingOption(option)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeletingOption(option)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <EditShiftOptionDialog
        option={editingOption}
        onOpenChange={(open: boolean) => !open && setEditingOption(null)}
      />

      <DeleteShiftOptionDialog
        option={deletingOption}
        onOpenChange={(open: boolean) => !open && setDeletingOption(null)}
      />
    </div>
  )
} 