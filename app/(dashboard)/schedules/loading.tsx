import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function ScheduleCalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-[100px]" />
      </div>
      
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-px">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square p-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="mt-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function ScheduleListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-[100px]" />
      </div>
      
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
