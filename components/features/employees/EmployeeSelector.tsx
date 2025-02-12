'use client'

import React from 'react'
import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/index'
import { Search } from 'lucide-react'

interface Employee {
  id: string
  name: string
  role: string
  availability?: {
    start: string
    end: string
  }[]
}

interface EmployeeSelectorProps {
  employees: Employee[]
  selectedId: string | null
  onSelect: (id: string) => void
  requiredRole: string
  filterByRole?: boolean
  showAvailability?: boolean
  enableSearch?: boolean
  isLoading?: boolean
  showRoleBadges?: boolean
  checkAvailability?: boolean
  className?: string
}

export function EmployeeSelector({
  employees,
  selectedId,
  onSelect,
  requiredRole,
  filterByRole = false,
  showAvailability = false,
  enableSearch = false,
  isLoading = false,
  showRoleBadges = false,
  checkAvailability = false,
  className
}: EmployeeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEmployees = useMemo(() => {
    let result = employees

    // Filter by role if enabled
    if (filterByRole) {
      result = result.filter(employee => employee.role === requiredRole)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(employee =>
        employee.name.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query)
      )
    }

    return result
  }, [employees, filterByRole, requiredRole, searchQuery])

  const isEmployeeAvailable = (employee: Employee): boolean => {
    if (!checkAvailability) return true
    return (employee.availability?.length ?? 0) > 0
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {enableSearch && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      {filteredEmployees.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No employees found
        </p>
      ) : (
        <ScrollArea className="h-[400px] rounded-md border">
          <div className="p-4 space-y-2">
            {filteredEmployees.map(employee => {
              const isAvailable = isEmployeeAvailable(employee)
              const isSelected = employee.id === selectedId

              return (
                <Card
                  key={employee.id}
                  data-testid={`employee-${employee.id}`}
                  className={cn(
                    "p-4 cursor-pointer transition-colors",
                    isSelected && "bg-accent",
                    !isAvailable && "opacity-50 cursor-not-allowed",
                    "hover:bg-accent/50"
                  )}
                  onClick={() => isAvailable && onSelect(employee.id)}
                  aria-disabled={!isAvailable}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{employee.name}</p>
                      {showRoleBadges && (
                        <Badge
                          variant="secondary"
                          data-testid="role-badge"
                        >
                          {employee.role}
                        </Badge>
                      )}
                    </div>

                    {showAvailability && employee.availability && (
                      <div className="text-sm text-muted-foreground">
                        {employee.availability.map((slot, index) => (
                          <div key={index} className="whitespace-nowrap">
                            {slot.start} - {slot.end}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

EmployeeSelector.displayName = "EmployeeSelector" 