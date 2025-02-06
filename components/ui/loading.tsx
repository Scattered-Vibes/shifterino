'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
  text?: string
}

export function Loading({
  size = 24,
  text = 'Loading...',
  className,
  ...props
}: LoadingProps) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] w-full flex-col items-center justify-center',
        className
      )}
      {...props}
    >
      <Loader2 className="h-[var(--size)] w-[var(--size)] animate-spin" style={{ '--size': `${size}px` } as React.CSSProperties} />
      {text && (
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )
}

interface SuspenseBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SuspenseBoundary({ children, fallback }: SuspenseBoundaryProps) {
  return (
    <React.Suspense
      fallback={
        fallback || (
          <Loading />
        )
      }
    >
      {children}
    </React.Suspense>
  )
}

// Specialized loading components for different contexts
export function TableLoading() {
  return (
    <Loading
      className="min-h-[200px]"
      text="Loading data..."
    />
  )
}

export function FormLoading() {
  return (
    <Loading
      className="min-h-[100px]"
      size={20}
      text="Loading form..."
    />
  )
}

export function ButtonLoading({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center space-x-2', className)}
      {...props}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Loading...</span>
    </div>
  )
}

export function InlineLoading({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center space-x-2', className)}
      {...props}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  )
} 