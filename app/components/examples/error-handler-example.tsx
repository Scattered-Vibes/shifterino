'use client'

import { useErrorHandler } from '@/lib/hooks'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

export function ErrorHandlerExample() {
  const { handleAppError } = useErrorHandler()

  // Example mutation that might fail
  const mutation = useMutation({
    mutationFn: async () => {
      throw new Error('This is a test error')
    },
    onError: handleAppError,
  })

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Error Handler Example</h2>
      <Button 
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        Test Error Handler
      </Button>
    </div>
  )
} 