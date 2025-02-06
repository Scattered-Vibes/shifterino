import { z } from 'zod'

/**
 * Environment variable schema validation
 * This ensures all required environment variables are present and of the correct type
 */
const envSchema = z.object({
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

export type Env = z.infer<typeof envSchema>

/**
 * Validates environment variables at runtime
 * Throws an error if any required variables are missing or invalid
 */
function validateEnv(): Env {
  try {
    const parsed = envSchema.safeParse(process.env)

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
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DOMAIN,
  NODE_ENV
} = env 