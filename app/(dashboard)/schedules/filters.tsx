'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MixerHorizontalIcon } from '@radix-ui/react-icons'

const shiftTypes = [
  { value: 'early', label: 'Early' },
  { value: 'day', label: 'Day' },
  { value: 'swing', label: 'Swing' },
  { value: 'graveyard', label: 'Graveyard' },
]

export function ScheduleFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={searchParams.get('shift_type') || ''}
        onValueChange={(value) => {
          router.push(pathname + '?' + createQueryString('shift_type', value))
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by shift type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All shift types</SelectItem>
          {shiftTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MixerHorizontalIcon className="mr-2 h-4 w-4" />
            More Filters
            {searchParams.size > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 rounded-sm px-1 font-normal"
              >
                {searchParams.size}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              router.push(pathname)
            }}
          >
            Reset filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 