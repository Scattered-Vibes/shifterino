'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTableData, insertTableData, updateTableData, deleteTableData } from '@/app/actions'
import type { Database } from '@/types/supabase/database'

type Tables = Database['public']['Tables']

/**
 * Hook to fetch data from any table
 */
export function useTableData<T extends keyof Tables>(
  table: T,
  query?: Parameters<typeof fetchTableData>[1],
  options?: {
    enabled?: boolean
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey: [table, query],
    queryFn: () => fetchTableData(table, query),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  })
}

/**
 * Hook to insert data into any table
 */
export function useInsertData<T extends keyof Tables>(
  table: T,
  options?: {
    onSuccess?: () => void
    onError?: (error: Error) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Tables[T]['Insert']) => insertTableData(table, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] })
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to update data in any table
 */
export function useUpdateData<T extends keyof Tables>(
  table: T,
  options?: {
    onSuccess?: () => void
    onError?: (error: Error) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Tables[T]['Update'] }) =>
      updateTableData(table, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] })
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to delete data from any table
 */
export function useDeleteData<T extends keyof Tables>(
  table: T,
  options?: {
    onSuccess?: () => void
    onError?: (error: Error) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => deleteTableData(table, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] })
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      options?.onError?.(error)
    },
  })
} 