import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

/**
 * Creates a Supabase client instance for server-side operations using the public anonymous key.
 *
 * This function configures and returns a Supabase client that uses custom cookie management
 * through Next.js headers. It is intended for operations where the anon key is sufficient.
 *
 * @returns A Supabase client instance configured with the public URL and anon key.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Retrieves the value of a cookie by name.
         *
         * @param {string} name - The name of the cookie to retrieve.
         * @returns {string | undefined} The value of the cookie if found, otherwise undefined.
         */
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        /**
         * Sets a cookie with the specified name, value, and options.
         *
         * @param {string} name - The name of the cookie.
         * @param {string} value - The value to assign to the cookie.
         * @param {any} options - Additional options for cookie configuration.
         */
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('Cookie set error:', error)
          }
        },
        /**
         * Removes a cookie by setting its value to an empty string and its maxAge to 0.
         *
         * @param {string} name - The name of the cookie to remove.
         * @param {any} options - Options used during the removal process.
         */
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            console.error('Cookie remove error:', error)
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}

/**
 * Creates a Supabase client instance for server-side operations using the service role key.
 *
 * This client is meant for operations requiring elevated privileges. It uses the service role key
 * along with standard cookie management via Next.js headers.
 *
 * @returns A Supabase client instance configured with the service role key.
 */
export function createServiceClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        /**
         * Retrieves the value of a cookie by name.
         *
         * @param {string} name - The name of the cookie to retrieve.
         * @returns {string | undefined} The cookie value if it exists.
         */
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        /**
         * Sets a cookie with the provided name, value, and options.
         *
         * @param {string} name - The name of the cookie.
         * @param {string} value - The value to set for the cookie.
         * @param {CookieOptions} options - Additional options for the cookie.
         */
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('Cookie set error:', error)
          }
        },
        /**
         * Removes a cookie by setting its value to an empty string and expiring it immediately.
         *
         * @param {string} name - The name of the cookie to remove.
         * @param {CookieOptions} options - Options used during cookie removal.
         */
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            console.error('Cookie remove error:', error)
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}