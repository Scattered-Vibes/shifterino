'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { TrashIcon } from '@radix-ui/react-icons'
import type { Database } from '@/types/database'

type StaffingRequirement = Database['public']['Tables']['staffing_requirements']['Row']

interface DeleteRequirementDialogProps {
  requirement: StaffingRequirement
}

export function DeleteRequirementDialog({ requirement }: DeleteRequirementDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function onDelete() {
    try {
      setIsPending(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('staffing_requirements')
        .delete()
        .eq('id', requirement.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Staffing requirement deleted successfully.',
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting requirement:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete requirement. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this staffing requirement? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isPending}
            className="bg-red-600 text-white hover:bg-red-600/90 dark:bg-red-600 dark:text-white dark:hover:bg-red-600/90"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 