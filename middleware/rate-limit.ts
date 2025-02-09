import { NextResponse, type NextRequest } from 'next/server'
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

interface RateLimitStore {
  count: number
  resetTime: number
}

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // Maximum requests per window

const memoryStore = new Map<string, RateLimitStore>()

function cleanupStore() {
  const now = Date.now()
  Array.from(memoryStore.entries()).forEach(([key, value]) => {
    if (now >= value.resetTime) {
      memoryStore.delete(key)
    }
  })
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
  cleanupStore()

  const current = memoryStore.get(key)

  if (!current) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return true
  }

  if (now > current.resetTime) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return true
  }

  const newCount = current.count + 1
  if (newCount > config.maxRequests) {
    return false
  }

  memoryStore.set(key, {
    count: newCount,
    resetTime: current.resetTime,
  })

  return true
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse | null> {
  const ip = request.ip ?? 'anonymous'
  const now = Date.now()

  // Clean up expired entries
  cleanupStore()

  const currentLimit = memoryStore.get(ip)

  if (!currentLimit) {
    memoryStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return null
  }

  if (now > currentLimit.resetTime) {
    memoryStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return null
  }

  const newCount = currentLimit.count + 1
  if (newCount > MAX_REQUESTS) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': `${Math.ceil((currentLimit.resetTime - now) / 1000)}`,
      },
    })
  }

  memoryStore.set(ip, {
    count: newCount,
    resetTime: currentLimit.resetTime,
  })

  return null
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