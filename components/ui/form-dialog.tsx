'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Spinner } from '@/components/ui/spinner'

interface FormDialogProps<T extends z.ZodType> {
  trigger: React.ReactNode
  title: string
  description?: string
  schema: T
  defaultValues?: Partial<z.infer<T>>
  onSubmit: (values: z.infer<T>) => Promise<void>
  children: React.ReactNode
  submitText?: string
  cancelText?: string
}

export function FormDialog<T extends z.ZodType>({
  trigger,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  children,
  submitText = 'Save',
  cancelText = 'Cancel'
}: FormDialogProps<T>) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<T>
  })
  
  async function handleSubmit(values: z.infer<T>) {
    try {
      setIsPending(true)
      await onSubmit(values)
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error('Form submission failed:', error)
    } finally {
      setIsPending(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {children}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {cancelText}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                {submitText}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 