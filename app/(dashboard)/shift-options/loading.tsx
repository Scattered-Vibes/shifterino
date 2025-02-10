import { Skeleton } from '@/components/ui/skeleton'

export function ShiftOptionsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="h-16 border-b px-4">
          <div className="flex h-full items-center justify-between">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-8 w-[100px]" />
          </div>
        </div>
        <div className="p-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b py-4 last:border-0"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-[70px]" />
                <Skeleton className="h-8 w-[70px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
