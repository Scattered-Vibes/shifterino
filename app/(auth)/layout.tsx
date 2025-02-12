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
    <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
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
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthSidebar />
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {children}
        </div>
      </div>
    </div>
  )
} 