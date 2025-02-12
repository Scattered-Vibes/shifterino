'use server'

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { handleError } from '@/lib/utils/error-handler'
import type { UpdateProfileInput } from '@/types/profile'

export async function updateProfile(data: UpdateProfileInput) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string) {
            cookieStore.delete(name)
          },
        },
      }
    )

    // First update the employee record
    const { error: employeeError } = await supabase
      .from('employees')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        shift_pattern: data.shift_pattern,
        preferred_shift_category: data.preferred_shift_category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .eq('auth_id', data.auth_id)

    if (employeeError) {
      return { error: handleError(employeeError).message }
    }

    // Then update the user metadata
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
      },
    })

    if (metadataError) {
      return { error: handleError(metadataError).message }
    }

    return { success: true }
  } catch (error) {
    return { error: handleError(error).message }
  }
}
