import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const configs: Record<string, RateLimitConfig> = {
  auth: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
}

// In-memory store for development
const memoryStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Clean up expired entries from memory store
 */
function cleanupMemoryStore() {
  const now = Date.now()
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetTime <= now) {
      memoryStore.delete(key)
    }
  }
}

/**
 * Rate limit using Supabase system_settings table
 */
async function rateLimitSupabase(
  key: string,
  config: RateLimitConfig,
  supabase: ReturnType<typeof createClient>
) {
  const now = Date.now()
  const windowKey = `rate_limit:${key}:${Math.floor(now / config.windowMs)}`

  try {
    // Try to get current count
    const { data: setting, error: getError } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', windowKey)
      .single()

    if (getError && getError.code !== 'PGRST116') { // Not found error
      console.error('Error getting rate limit:', getError)
      return true // Allow request on error
    }

    const currentCount = setting ? parseInt(setting.setting_value, 10) : 0

    if (currentCount >= config.maxRequests) {
      return false // Rate limit exceeded
    }

    // Increment counter
    if (setting) {
      const { error: updateError } = await supabase
        .from('system_settings')
        .update({ setting_value: (currentCount + 1).toString() })
        .eq('setting_key', windowKey)

      if (updateError) {
        console.error('Error updating rate limit:', updateError)
        return true // Allow request on error
      }
    } else {
      const { error: insertError } = await supabase
        .from('system_settings')
        .insert({
          setting_key: windowKey,
          setting_value: '1',
          description: 'Rate limit counter',
        })

      if (insertError) {
        console.error('Error creating rate limit:', insertError)
        return true // Allow request on error
      }
    }

    return true
  } catch (error) {
    console.error('Unexpected error in rate limiting:', error)
    return true // Allow request on error
  }
}

/**
 * Rate limit using memory store
 */
function rateLimitMemory(key: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  cleanupMemoryStore()

  const windowKey = `${key}:${Math.floor(now / config.windowMs)}`
  const current = memoryStore.get(windowKey)

  if (!current) {
    memoryStore.set(windowKey, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return true
  }

  if (current.count >= config.maxRequests) {
    return false
  }

  current.count++
  return true
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: NextRequest,
  configKey: keyof typeof configs = 'api'
) {
  const ip = request.ip || 'unknown'
  const key = `${configKey}:${ip}`
  const config = configs[configKey]

  if (!config) {
    console.error(`Unknown rate limit config: ${configKey}`)
    return true // Allow request if config not found
  }

  // Use Supabase in production, memory store in development
  if (process.env.NODE_ENV === 'production') {
    const supabase = createClient()
    return rateLimitSupabase(key, config, supabase)
  }

  return rateLimitMemory(key, config)
}

/**
 * Helper to create rate limit response
 */
export function createRateLimitResponse(windowMs: number) {
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil(windowMs / 1000).toString(),
      },
    }
  )
} 