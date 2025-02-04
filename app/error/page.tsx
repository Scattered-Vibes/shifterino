import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-8">We encountered an error while processing your request.</p>
        <Button asChild>
          <Link href="/overview">Return to Overview</Link>
        </Button>
      </div>
    </div>
  )
} 