'use client'

import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'

interface OverviewContentProps {
  userId: string
  role: string
}

export function OverviewContent({ userId, role }: OverviewContentProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <div>Loading overview content...</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Schedule Overview</h3>
        <p>View and manage your upcoming shifts</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Time Off Requests</h3>
        <p>Manage your time off requests</p>
      </Card>

      {role === 'manager' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Staff Management</h3>
          <p>Manage employee schedules and requests</p>
        </Card>
      )}
    </div>
  )
} 