'use client'

import { useRouter } from 'next/navigation'

import type { TimeOffRequest } from '@/app/types/time-off'

import { TimeOffRequests } from '../../manage/components/TimeOffRequests'

interface TimeOffRequestsWrapperProps {
  initialRequests: TimeOffRequest[]
}

export function TimeOffRequestsWrapper({
  initialRequests,
}: TimeOffRequestsWrapperProps) {
  const router = useRouter()

  const handleStatusUpdate = () => {
    router.refresh()
  }

  return (
    <TimeOffRequests
      requests={initialRequests}
      onStatusUpdate={handleStatusUpdate}
    />
  )
}
