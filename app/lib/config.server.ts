/**
 * Server-side Application Configuration
 * 
 * This module provides a centralized configuration object for server-side use.
 * It handles both public and private environment variables safely.
 */

const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

// Validate all required env vars are present
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const config = {
  supabase: {
    url: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    domain: process.env.NEXT_PUBLIC_DOMAIN || '',
  },
  env: process.env.NODE_ENV || 'development',
} as const

export type ServerConfig = typeof config

// Validate required environment variables
function validateConfig(config: ServerConfig) {
  const { supabase } = config

  if (!supabase.url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabase.anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  if (!supabase.serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  return config
}

export default validateConfig(config) 