'use client'

import { useFormState } from 'react-dom'
import { testRedirect } from '@/app/actions/test-redirect'
import { Button } from "@/components/ui/button"

export function TestRedirect() {
    const [state, formAction] = useFormState(testRedirect, null)

    return (
        <form action={formAction}>
            <Button type="submit">Test Redirect</Button>
        </form>
    )
} 