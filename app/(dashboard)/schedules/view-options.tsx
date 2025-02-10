'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CalendarIcon, GridIcon, ListBulletIcon } from '@radix-ui/react-icons'

export function ViewOptions() {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Month
          </DropdownMenuItem>
          <DropdownMenuItem>
            <GridIcon className="mr-2 h-4 w-4" />
            Week
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ListBulletIcon className="mr-2 h-4 w-4" />
            Day
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 