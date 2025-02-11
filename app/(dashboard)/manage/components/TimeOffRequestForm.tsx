'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { getUserFriendlyMessage } from '@/app/lib/utils/error-handler'

import {
  checkTimeOffConflicts,
  createTimeOffRequest,
} from '../actions/time-off'

interface TimeOffRequestFormProps {
  employeeId: string
  onRequestSubmitted?: () => void
}

export default function TimeOffRequestForm({
  employeeId,
  onRequestSubmitted,
}: TimeOffRequestFormProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper function to format date to YYYY-MM-DD
  function formatDateForDB(date: Date | undefined): string {
    if (!date) {
      throw new Error('Date is required')
    }
    const isoString = date.toISOString()
    const [dateString] = isoString.split('T')
    if (!dateString) {
      throw new Error('Invalid date format')
    }
    return dateString
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!startDate || !endDate || !reason.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Since we've checked for null dates above, we know these dates are defined
      const startDateString = formatDateForDB(startDate)
      const endDateString = formatDateForDB(endDate)

      // Check for conflicts using formatted dates
      const { data: hasConflicts, error: conflictError } = await checkTimeOffConflicts(
        employeeId,
        startDateString,
        endDateString
      )

      if (conflictError) {
        toast.error(getUserFriendlyMessage(conflictError.code))
        return
      }

      if (hasConflicts) {
        toast.error('You already have approved time off during this period')
        return
      }

      // Submit request with formatted dates
      const { error: createError } = await createTimeOffRequest({
        employee_id: employeeId,
        start_date: startDateString,
        end_date: endDateString,
        reason,
      })

      if (createError) {
        toast.error(getUserFriendlyMessage(createError.code))
        return
      }

      toast.success('Time off request submitted successfully')

      // Reset form
      setStartDate(undefined)
      setEndDate(undefined)
      setReason('')

      // Notify parent
      onRequestSubmitted?.()
    } catch (err) {
      toast.error('Failed to submit time off request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Request Time Off</h3>
          <p className="text-sm text-gray-500">
            Select your requested dates and provide a reason for your time off.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              disabled={(date) => !startDate || date < startDate}
              className="rounded-md border"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Reason</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for your time off request"
            className="min-h-[100px]"
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </Card>
  )
}
