/**
 * Application Configuration
 * 
 * This module provides a centralized configuration object for client-side use.
 * It handles public environment variables safely.
 */

const requiredPublicEnvVar = (name: string, value: string | undefined): string => {
  if (!value && process.env.NODE_ENV === 'development') {
    console.warn(`Missing public environment variable: ${name}`)
  }
  return value || ''
}

const config = {
  supabase: {
    url: requiredPublicEnvVar('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: requiredPublicEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    domain: process.env.NEXT_PUBLIC_DOMAIN || '',
  },
  env: process.env.NODE_ENV || 'development',
} as const

export type Config = typeof config

// Validate required environment variables
function validateConfig(config: Config) {
  const { supabase, app } = config

  // Only validate in development
  if (config.env === 'development') {
    if (!supabase.url) {
      console.warn('Missing NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!supabase.anonKey) {
      console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    if (!app.url) {
      console.warn('Missing NEXT_PUBLIC_APP_URL')
    }
    if (!app.siteUrl) {
      console.warn('Missing NEXT_PUBLIC_SITE_URL')
    }
  }

  return config
}

export default validateConfig(config) 