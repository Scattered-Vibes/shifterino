import { Metadata } from 'next'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication pages for the dispatch scheduling system',
}

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    
      
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      
    
  )
} 