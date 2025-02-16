import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSupabase } from '@/app/providers/SupabaseContext'
import type { Database } from '@/types/supabase/database'
import {
  getStaffingRequirements,
  getStaffingRequirement,
  createStaffingRequirement,
  updateStaffingRequirement,
  deleteStaffingRequirement,
  getStaffingRequirementsByTimeRange,
  getStaffingRequirementsByDay
} from '../server/use-staffing-requirements'

type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Row']

export function useStaffingRequirements() {
  const { supabase } = useSupabase()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['staffing-requirements'],
    queryFn: () => getStaffingRequirements()
  })

  // Set up real-time subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('staffing-requirements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staffing_requirements'
        },
        () => {
          // Invalidate and refetch on any change
          queryClient.invalidateQueries({ queryKey: ['staffing-requirements'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient])

  return query
}

export function useStaffingRequirement(requirementId: string) {
  return useQuery({
    queryKey: ['staffing-requirement', requirementId],
    queryFn: () => getStaffingRequirement(requirementId),
    enabled: !!requirementId
  })
}

export function useCreateStaffingRequirement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createStaffingRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffing-requirements'] })
      toast.success('Staffing requirement created successfully')
    },
    onError: (error) => {
      console.error('Error creating staffing requirement:', error)
      toast.error('Failed to create staffing requirement')
    }
  })
}

export function useUpdateStaffingRequirement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requirementId, data }: { requirementId: string, data: Partial<StaffingRequirement> }) =>
      updateStaffingRequirement(requirementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffing-requirements'] })
      toast.success('Staffing requirement updated successfully')
    },
    onError: (error) => {
      console.error('Error updating staffing requirement:', error)
      toast.error('Failed to update staffing requirement')
    }
  })
}

export function useDeleteStaffingRequirement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteStaffingRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffing-requirements'] })
      toast.success('Staffing requirement deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting staffing requirement:', error)
      toast.error('Failed to delete staffing requirement')
    }
  })
}

export function useStaffingRequirementsByTimeRange(startTime: string, endTime: string) {
  return useQuery({
    queryKey: ['staffing-requirements', 'time-range', startTime, endTime],
    queryFn: () => getStaffingRequirementsByTimeRange(startTime, endTime),
    enabled: !!startTime && !!endTime
  })
}

export function useStaffingRequirementsByDay(dayOfWeek: number) {
  return useQuery({
    queryKey: ['staffing-requirements', 'day', dayOfWeek],
    queryFn: () => getStaffingRequirementsByDay(dayOfWeek),
    enabled: dayOfWeek >= 0 && dayOfWeek <= 6
  })
} 