'use client'

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { createTimeOffRequest, checkTimeOffConflicts } from '../actions/time-off'
import { toast } from '@/components/ui/use-toast'

interface TimeOffRequestFormProps {
  employeeId: string
  onRequestSubmitted?: () => void
}

export default function TimeOffRequestForm({ 
  employeeId,
  onRequestSubmitted 
}: TimeOffRequestFormProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!startDate || !endDate || !reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Check for conflicts
      const hasConflicts = await checkTimeOffConflicts(
        employeeId,
        startDate.toISOString(),
        endDate.toISOString()
      )

      if (hasConflicts) {
        toast({
          title: 'Schedule Conflict',
          description: 'You already have approved time off during this period',
          variant: 'destructive'
        })
        return
      }

      // Submit request
      await createTimeOffRequest({
        employee_id: employeeId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reason
      })

      toast({
        title: 'Success',
        description: 'Time off request submitted successfully'
      })

      // Reset form
      setStartDate(undefined)
      setEndDate(undefined)
      setReason('')
      
      // Notify parent
      onRequestSubmitted?.()
    } catch (err) {
      console.error('Failed to submit time off request:', err)
      toast({
        title: 'Error',
        description: 'Failed to submit time off request',
        variant: 'destructive'
      })
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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