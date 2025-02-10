'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type ShiftOption = Database['public']['Tables']['shift_options']['Row']

interface DeleteShiftOptionDialogProps {
  option: ShiftOption | null
  onOpenChange: (open: boolean) => void
}

export function DeleteShiftOptionDialog({
  option,
  onOpenChange,
}: DeleteShiftOptionDialogProps) {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function onDelete() {
    if (!option) return

    try {
      setIsPending(true)
      const supabase = createClient()

      // Check if the shift option is in use
      const { data: shifts, error: checkError } = await supabase
        .from('individual_shifts')
        .select('id')
        .eq('shift_option_id', option.id)
        .limit(1)

      if (checkError) throw checkError

      if (shifts && shifts.length > 0) {
        toast({
          title: 'Cannot Delete',
          description: 'This shift option is currently in use by one or more shifts.',
          variant: 'destructive',
        })
        return
      }

      const { error: deleteError } = await supabase
        .from('shift_options')
        .delete()
        .eq('id', option.id)

      if (deleteError) throw deleteError

      toast({
        title: 'Success',
        description: 'Shift option deleted successfully.',
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting shift option:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete shift option. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={!!option} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Shift Option</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this shift option? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 