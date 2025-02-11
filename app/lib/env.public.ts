import { z } from 'zod'

/**
 * Public environment variable schema validation
 * Only includes NEXT_PUBLIC_* variables that are safe to expose to the client
 */
const publicEnvSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string()
    .min(1, 'Supabase URL is required')
    .default(process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string()
    .min(1, 'Supabase anon key is required')
    .default(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string()
    .default(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  NEXT_PUBLIC_SITE_URL: z.string()
    .default(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  NEXT_PUBLIC_DOMAIN: z.string()
    .optional()
    .default(process.env.NEXT_PUBLIC_DOMAIN || ''),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>

/**
 * Gets environment variables from various sources
 * Prioritizes runtime config over process.env
 */
function getPublicEnvironment() {
  // Check if we're in the browser
  const isBrowser = typeof window !== 'undefined'
  
  // In the browser, we should have the variables injected into the HTML
  if (isBrowser) {
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || '',
    }
  }

  // On the server, we can access process.env directly
  return process.env
}

/**
 * Validates public environment variables at runtime
 * More lenient validation for client-side usage
 */
function validatePublicEnv(): PublicEnv {
  try {
    const env = getPublicEnvironment()
    const parsed = publicEnvSchema.safeParse(env)

    if (!parsed.success) {
      console.error(
        '❌ Invalid public environment variables:',
        JSON.stringify(parsed.error.format(), null, 2)
      )
      
      // In development, throw the error
      if (process.env.NODE_ENV === 'development') {
        throw new Error('Invalid public environment variables')
      }
      
      // In production, return defaults
      return publicEnvSchema.parse({})
    }

    return parsed.data
  } catch (error) {
    console.error('❌ Error validating public environment variables:', error)
    
    // In development, throw the error
    if (process.env.NODE_ENV === 'development') {
      throw error
    }
    
    // In production, return defaults
    return publicEnvSchema.parse({})
  }
}

export const env = validatePublicEnv()

// Export individual variables for convenience
export const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DOMAIN,
} = env 