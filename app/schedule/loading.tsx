import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function ScheduleLoading() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="mb-8 h-10 w-[300px]" />
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-[400px]" />
        
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-[400px]" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 