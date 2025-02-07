import { Skeleton } from '@/components/ui/skeleton'

export default function SchedulesLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-5 w-[100px]" />
      </div>

      {/* Calendar skeleton */}
      <div className="rounded-md border p-4">
        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-[100px]" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-6">
          {/* Week days */}
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`day-${i}`} className="h-8 w-8" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={`date-${i}`} className="h-8 w-8" />
          ))}
        </div>
      </div>
    </div>
  )
}
