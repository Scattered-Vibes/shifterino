'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { Database } from '@/types/supabase/database'
import { createClient } from '@/lib/supabase/client'
import { Loading } from '@/components/ui/loading'

type Employee = Database['public']['Tables']['employees']['Row']
type Schedule = Database['public']['Tables']['schedules']['Row']
type EmployeeWithSchedules = Employee & {
  schedules: Schedule[]
}

const ITEMS_PER_PAGE = 10

interface FetchEmployeesResponse {
  data: EmployeeWithSchedules[]
  nextPage: number | null
}

async function fetchStaffPage(page: number): Promise<FetchEmployeesResponse> {
  const supabase = createClient()
  const start = page * ITEMS_PER_PAGE

  const { data, error, count } = await supabase
    .from('employees')
    .select('*, schedules(*)', { count: 'exact' })
    .range(start, start + ITEMS_PER_PAGE - 1)
    .order('last_name', { ascending: true })

  if (error) throw error

  const hasMore = count ? start + ITEMS_PER_PAGE < count : false
  return {
    data: (data || []) as EmployeeWithSchedules[],
    nextPage: hasMore ? page + 1 : null,
  }
}

/**
 * StaffList component renders a list of employees in a table and provides a dialog to add a new employee.
 *
 * @returns {JSX.Element} The rendered component.
 */
export function StaffList() {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useInfiniteQuery<FetchEmployeesResponse, Error>({
      queryKey: ['staff'],
      queryFn: ({ pageParam }) => fetchStaffPage(pageParam as number),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 0,
    })

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (!target) return
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    const element = loadMoreRef.current
    const cleanup = () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }

    if (!element) return cleanup

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    })

    observerRef.current.observe(element)

    return cleanup
  }, [handleObserver])

  if (isLoading) {
    return <Loading text="Loading staff..." />
  }

  if (error) {
    return <div>Error loading staff</div>
  }

  if (!data?.pages[0]?.data.length) {
    return <div>No staff found</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {data.pages.map((page, pageIndex) => (
          <div key={pageIndex}>
            {page.data.map((employee) => (
              <div
                key={employee.id}
                className="rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <p className="text-sm capitalize text-gray-500">
                      {employee.role}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {employee.schedules.length} shifts scheduled
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div ref={loadMoreRef} className="h-10">
        {isFetchingNextPage && <Loading text="Loading more staff..." />}
      </div>
    </div>
  )
}
