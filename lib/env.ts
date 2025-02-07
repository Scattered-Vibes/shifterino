/**
 * @deprecated Use @/lib/env.server.ts for server-side code or @/lib/env.public.ts for client-side code
 */

export * from './env.server'

import { z } from 'zod'

/**
 * Environment variable schema validation
 */
const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string()
    .min(1, 'Supabase URL is required'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string()
    .min(1, 'Supabase anon key is required'),
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string()
    .default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_URL: z.string()
    .default('http://localhost:3000'),
  NEXT_PUBLIC_DOMAIN: z.string()
    .optional()
    .default(''),
})

export type Env = z.infer<typeof envSchema>

/**
 * Gets environment variables from various sources
 * Prioritizes runtime config over process.env
 */
function getEnvironment() {
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
 * Validates environment variables at runtime
 */
function validateEnv(): Env {
  try {
    const env = getEnvironment()
    const parsed = envSchema.safeParse(env)

    if (!parsed.success) {
      console.error(
        '❌ Invalid environment variables:',
        JSON.stringify(parsed.error.format(), null, 2)
      )
      throw new Error('Invalid environment variables')
    }

    return parsed.data
  } catch (error) {
    console.error('❌ Error validating environment variables:', error)
    throw error
  }
}

export const env = validateEnv()

// Export individual variables for convenience
export const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DOMAIN,
} = env 