import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function RequirementsNotFound() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Staffing Requirements</h1>
      </div>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          <p className="mb-4">The requested staffing requirements could not be found.</p>
          <Button asChild variant="outline">
            <Link href="/requirements">Return to Requirements</Link>
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
} 