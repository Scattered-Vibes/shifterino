import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from '@/types/supabase/database'

// Validate required environment variables
function validateEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate URL format
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format')
  }

  console.log('Environment variables validated successfully')
}

// Initialize client with enhanced error handling
export function createClient() {
  console.log('=== Creating Supabase server client ===')
  
  try {
    validateEnvVars()
    
    const cookieStore = cookies()
    console.log('Cookie store initialized')

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            console.log('Reading cookie:', { 
              name, 
              exists: !!cookie,
              value: cookie ? '[PRESENT]' : '[NOT FOUND]'
            })
            return cookie?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              console.log('Setting cookie:', { 
                name, 
                options: {
                  ...options,
                  value: name.includes('token') ? '[REDACTED]' : value
                }
              })
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.warn('Cookie set failed (expected if called from Server Component):', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name,
                options: {
                  ...options,
                  value: name.includes('token') ? '[REDACTED]' : value
                }
              })
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              console.log('Removing cookie:', { name, options })
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.warn('Cookie remove failed (expected if called from Server Component):', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name,
                options
              })
            }
          },
        },
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase client:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

/**
 * Create a Supabase client with service role for administrative operations
 * This should only be used server-side for operations that require elevated privileges
 */
export function createServiceClient() {
  console.log('=== Creating Supabase service client ===')
  
  try {
    validateEnvVars()
    
    console.log('Creating service client with elevated privileges')
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          detectSessionInUrl: false,
          autoRefreshToken: false
        },
        cookies: {
          get: () => {
            console.log('Service client: Cookie get operation blocked')
            return undefined
          },
          set: () => {
            console.log('Service client: Cookie set operation blocked')
          },
          remove: () => {
            console.log('Service client: Cookie remove operation blocked')
          }
        }
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase service client:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// Re-export types that might be needed by consumers
export type { Database }