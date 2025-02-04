import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = cookies()
  const supabase = createClient()

  // Sign out on the server
  await supabase.auth.signOut()

  // Clear all cookies
  const cookieNames = cookieStore.getAll().map(cookie => cookie.name)
  cookieNames.forEach(name => {
    cookieStore.delete(name)
  })

  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        'Location': '/login'
      }
    }
  )
} 