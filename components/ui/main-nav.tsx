'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/app/lib/utils'

const routes = [
  {
    label: 'Overview',
    href: '/overview',
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-6">
      <Link href="/" className="flex items-center space-x-2">
        <span className="font-bold">911 Dispatch Scheduler</span>
      </Link>
      
    </nav>
  )
} 