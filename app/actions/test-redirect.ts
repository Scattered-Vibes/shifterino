'use server'

import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'

export async function testRedirect() {
    noStore()
    console.log('[test-redirect] Redirecting to /overview...')
    redirect('/overview')
} 