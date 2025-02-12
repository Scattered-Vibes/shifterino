import { cn } from '@/lib/utils/index'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'table' | 'form' | 'nav' | 'stats'
}

function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        {
          // Default skeleton
          'h-4 w-full': variant === 'default',
          
          // Card skeleton
          'space-y-4 rounded-xl border bg-card p-6 shadow': variant === 'card',
          
          // Table row skeleton
          'flex items-center space-x-4 py-4': variant === 'table',
          
          // Form field skeleton
          'space-y-2': variant === 'form',
          
          // Navigation item skeleton
          'flex items-center space-x-4 py-2': variant === 'nav',
          
          // Stats card skeleton
          'rounded-xl border bg-card p-6 shadow': variant === 'stats',
        },
        className
      )}
      {...props}
    />
  )
}

// Specialized skeleton components with predefined styles
function CardSkeleton() {
  return (
    <Skeleton variant="card">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </Skeleton>
  )
}

function TableRowSkeleton() {
  return (
    <Skeleton variant="table">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </Skeleton>
  )
}

function FormFieldSkeleton() {
  return (
    <Skeleton variant="form">
      <Skeleton className="h-4 w-[100px]" />
      <Skeleton className="h-10 w-full" />
    </Skeleton>
  )
}

function NavItemSkeleton() {
  return (
    <Skeleton variant="nav">
      <Skeleton className="h-6 w-6" />
      <Skeleton className="h-4 w-[100px]" />
    </Skeleton>
  )
}

function StatsCardSkeleton() {
  return (
    <Skeleton variant="stats">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-8 w-[120px]" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-[60px]" />
      </div>
    </Skeleton>
  )
}

// Dashboard skeleton for loading states
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
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
  DashboardSkeleton,
}
