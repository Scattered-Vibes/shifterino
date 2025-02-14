import { Metadata } from 'next'
import { Icons } from '@/components/ui/icons'

export const metadata: Metadata = {
  title: {
    default: 'Authentication',
    template: '%s | Shifterino',
  },
  description: 'Authentication pages for Shifterino',
}

interface AuthLayoutProps {
  children: React.ReactNode
}

function AuthSidebar() {
  return (
    <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
      <div className="absolute inset-0 bg-zinc-900" />
      <div className="relative z-20 flex items-center text-lg font-medium">
        <Icons.logo className="mr-2 h-6 w-6" />
        Shifterino
      </div>
      <div className="relative z-20 mt-auto">
        <blockquote className="space-y-2">
          <p className="text-lg">
            &ldquo;This scheduling system has revolutionized how we manage our 911 dispatch center. It&apos;s intuitive, efficient, and helps us maintain optimal staffing levels around the clock.&rdquo;
          </p>
          <footer className="text-sm">Sofia Davis, Dispatch Supervisor</footer>
        </blockquote>
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <AuthSidebar />
      <div className="flex items-center justify-center p-8">
        <div className="mx-auto w-full max-w-sm space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
} 