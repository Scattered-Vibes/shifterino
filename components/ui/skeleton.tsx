import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

// Card skeleton for consistent loading states
function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="space-y-4 p-6">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  )
}

// Table row skeleton for data tables
function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}

// Form field skeleton for loading states in forms
function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-[100px]" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

// Navigation item skeleton
function NavItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-2">
      <Skeleton className="h-6 w-6" />
      <Skeleton className="h-4 w-[100px]" />
    </div>
  )
}

// Stats card skeleton for dashboard metrics
function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-8 w-[120px]" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-[60px]" />
      </div>
    </div>
  )
}

export {
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  FormFieldSkeleton,
  NavItemSkeleton,
  StatsCardSkeleton,
}
