import { z } from 'zod'

/**
 * Server environment variable schema validation
 * Includes both public and private variables for server-side use
 */
const serverEnvSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_URL: z.string().url('Invalid site URL').default('http://localhost:3000'),
  NEXT_PUBLIC_DOMAIN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

/**
 * Validates server environment variables at runtime
 * Throws an error if any required variables are missing or invalid
 */
function validateServerEnv(): ServerEnv {
  try {
    const parsed = serverEnvSchema.safeParse(process.env)

    if (!parsed.success) {
      console.error(
        '❌ Invalid server environment variables:',
        JSON.stringify(parsed.error.format(), null, 2)
      )
      throw new Error('Invalid server environment variables')
    }

    return parsed.data
  } catch (error) {
    console.error('❌ Error validating server environment variables:', error)
    throw error
  }
}

export const env = validateServerEnv()

// Export individual variables for convenience
export const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DOMAIN,
  NODE_ENV
} = env 