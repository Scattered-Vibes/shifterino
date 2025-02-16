'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { signOut } from '@/app/(auth)/actions'
import { useFormState, useFormStatus } from 'react-dom'

export function SignOutButton() {
  const { toast } = useToast()
  const router = useRouter()
  const { pending } = useFormStatus()

  // Use a form with useFormState and useFormStatus
  const [state, formAction] = useFormState(signOut, null)

  return (
    <form action={formAction}>
      <Button
        variant="ghost"
        type="submit"
        className="w-full justify-start text-sm font-medium text-muted-foreground hover:text-primary"
        disabled={pending}
      >
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign Out
      </Button>
    </form>
  )
}
