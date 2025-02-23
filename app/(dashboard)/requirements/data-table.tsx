'use client'

import { useCallback, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Database } from '@/types/supabase/database'

type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Row']

interface RequirementsDataTableProps {
  promise: Promise<StaffingRequirement[]>
}

export async function RequirementsDataTable({ promise }: RequirementsDataTableProps) {
  const requirements = await promise
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time Block</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Min Staff</TableHead>
          <TableHead>Min Supervisors</TableHead>
          <TableHead className="w-[70px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requirements.map((req) => (
          <RequirementRow key={req.id} requirement={req} />
        ))}
      </TableBody>
    </Table>
  )
}

function RequirementRow({ requirement }: { requirement: StaffingRequirement }) {
  const [isEditing, setIsEditing] = useState(false)
  
  const handleEdit = useCallback(() => {
    setIsEditing(true)
  }, [])

  return (
    <TableRow>
      <TableCell>{requirement.team_id}</TableCell>
      <TableCell>{requirement.start_time}</TableCell>
      <TableCell>{requirement.end_time}</TableCell>
      <TableCell>{requirement.min_employees}</TableCell>
      <TableCell>{requirement.min_supervisors}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
} 