import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedules</h1>
          <p className="text-muted-foreground">
            View and manage employee schedules.
          </p>
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Schedule</CardTitle>
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b py-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-[80px]" />
                  <Skeleton className="h-8 w-[80px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

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
