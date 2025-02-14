import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    console.log('Cookie Store:', cookieStore.getAll())

    const { email, password } = await request.json()
    console.log('Attempting login with:', { email })

    // Log environment variables (sanitized)
    console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            console.log('Getting cookie:', name)
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log('Setting cookie:', name)
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            console.log('Removing cookie:', name)
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Test basic Supabase connection
    const { data: versionData, error: versionError } = await supabase.from('_version').select('*')
    console.log('Version check:', { versionData, versionError })

    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Sign in response:', { data, error })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 