import { Loader2 } from 'lucide-react'
import { cn } from '@/app/lib/utils'

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
}

export function LoadingSpinner({ size = 24, className, ...props }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center', className)}
      {...props}
    >
      <Loader2
        className="animate-spin text-muted-foreground"
        size={size}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
} 