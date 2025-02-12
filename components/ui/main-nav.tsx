'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/index'

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      <Link
        href="/overview"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        911 Dispatch Scheduler
      </Link>
    </nav>
  )
} 