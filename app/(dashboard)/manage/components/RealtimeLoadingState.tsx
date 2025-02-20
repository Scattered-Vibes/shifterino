'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReloadIcon } from '@radix-ui/react-icons'

interface RealtimeLoadingStateProps {
  status: 'CONNECTING' | 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR'
}

export function RealtimeLoadingState({ status }: RealtimeLoadingStateProps) {
  if (status === 'SUBSCRIBED') return null

  return (
    <Alert variant={status === 'CHANNEL_ERROR' ? 'destructive' : 'default'}>
      <AlertDescription className="flex items-center gap-2">
        <ReloadIcon className="h-4 w-4 animate-spin" />
        {status === 'CONNECTING' && 'Connecting to real-time updates...'}
        {status === 'CLOSED' && 'Connection closed. Attempting to reconnect...'}
        {status === 'CHANNEL_ERROR' && 'Error connecting to real-time updates.'}
      </AlertDescription>
    </Alert>
  )
} 