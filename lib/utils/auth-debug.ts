import { createClient } from '@supabase/supabase-js'

const DEBUG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE'
} as const

type DebugLevel = keyof typeof DEBUG_LEVELS

interface AuthDebugLog {
  timestamp: string
  level: DebugLevel
  event: string
  userId?: string
  sessionId?: string
  context?: Record<string, unknown>
  error?: Error
  cookies?: Record<string, string | undefined>
  request?: {
    method?: string
    path?: string
    headers?: Record<string, string>
  }
}

interface CookieState {
  name: string
  value?: string
  options?: Record<string, unknown>
  operation: 'get' | 'set' | 'remove'
  timestamp: string
}

interface CookieValidation {
  isValid: boolean
  issues: string[]
  domain?: string
  path?: string
  secure?: boolean
  sameSite?: string
  httpOnly?: boolean
}

class AuthDebugger {
  private static instance: AuthDebugger
  private logs: AuthDebugLog[] = []
  private cookieHistory: CookieState[] = []
  private isEnabled: boolean
  private debugLevel: DebugLevel
  private isNextContext: boolean

  private constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true'
    this.debugLevel = (process.env.DEBUG_LEVEL?.toUpperCase() as DebugLevel) || 'INFO'
    this.isNextContext = typeof window !== 'undefined' || process.env.NEXT_RUNTIME === 'edge'
  }

  static getInstance(): AuthDebugger {
    if (!AuthDebugger.instance) {
      AuthDebugger.instance = new AuthDebugger()
    }
    return AuthDebugger.instance
  }

  private shouldLog(level: DebugLevel): boolean {
    if (!this.isEnabled) return false
    const levels = Object.keys(DEBUG_LEVELS)
    return levels.indexOf(level) >= levels.indexOf(this.debugLevel)
  }

  private validateCookieOptions(name: string, options?: Record<string, any>): CookieValidation {
    const issues: string[] = []
    const validation: CookieValidation = {
      isValid: true,
      issues: [],
      domain: options?.domain,
      path: options?.path,
      secure: options?.secure,
      sameSite: options?.sameSite,
      httpOnly: options?.httpOnly
    }

    // Check domain
    if (name.includes('localhost') && options?.domain && !options.domain.includes('localhost')) {
      issues.push(`Cookie domain mismatch: ${options.domain} for localhost cookie`)
      validation.isValid = false
    }

    // Check path
    if (!options?.path) {
      issues.push('Path not specified')
      validation.isValid = false
    }

    // Check secure flag
    if (process.env.NODE_ENV === 'production' && !options?.secure) {
      issues.push('Secure flag not set in production')
      validation.isValid = false
    }

    // Check httpOnly
    if (!options?.httpOnly) {
      issues.push('HttpOnly flag not set')
      validation.isValid = false
    }

    // Check SameSite
    if (!options?.sameSite) {
      issues.push('SameSite attribute not specified')
      validation.isValid = false
    }

    validation.issues = issues
    return validation
  }

  private async getCurrentCookies(): Promise<Record<string, string | undefined>> {
    // Skip cookie check outside of Next.js context
    if (!this.isNextContext) {
      return {}
    }

    try {
      const { cookies } = await import('next/headers')
      const cookieStore = cookies()
      const authCookie = cookieStore.get('sb-localhost-auth-token')
      const refreshCookie = cookieStore.get('sb-localhost-refresh-token')
      
      return {
        'sb-localhost-auth-token': authCookie?.value,
        'sb-localhost-refresh-token': refreshCookie?.value
      }
    } catch (error) {
      console.debug('Cookie access not available (non-Next.js context)')
      return {}
    }
  }

  private async log(level: DebugLevel, event: string, context?: Record<string, unknown>, error?: Error) {
    if (!this.shouldLog(level)) return

    let currentCookies = {}
    if (this.isNextContext) {
      currentCookies = await this.getCurrentCookies()
    }
    
    const log: AuthDebugLog = {
      timestamp: new Date().toISOString(),
      level,
      event,
      context,
      error,
      cookies: currentCookies
    }

    this.logs.push(log)

    // Format for console output
    const logMessage = `[Auth ${level}] ${event}`
    const logDetails = {
      ...context,
      error: error?.message,
      cookies: currentCookies
    }

    switch (level) {
      case 'ERROR':
        console.error(logMessage, logDetails, error?.stack)
        break
      case 'WARN':
        console.warn(logMessage, logDetails)
        break
      case 'DEBUG':
        console.debug(logMessage, logDetails)
        break
      case 'TRACE':
        console.trace(logMessage, logDetails)
        break
      default:
        console.log(logMessage, logDetails)
    }

    // Store in Supabase if enabled
    if (process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true') {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      try {
        await supabase
          .from('auth_logs')
          .insert([{
            level,
            event,
            context: context || {},
            error_message: error?.message,
            cookies: currentCookies
          }])
      } catch (err) {
        console.error('Failed to store auth log:', err)
      }
    }
  }

  trackCookie(operation: 'get' | 'set' | 'remove', name: string, value?: string, options?: Record<string, unknown>) {
    const cookieState: CookieState = {
      operation,
      name,
      value: operation === 'remove' ? undefined : value,
      options,
      timestamp: new Date().toISOString()
    }
    
    this.cookieHistory.push(cookieState)
    
    if (operation === 'set') {
      const validation = this.validateCookieOptions(name, options)
      if (!validation.isValid) {
        this.warn(`Invalid cookie options for ${name}`, {
          validation,
          options
        })
      } else {
        this.debug(`Cookie ${operation}`, { cookie: cookieState, validation })
      }
    } else {
      this.debug(`Cookie ${operation}`, { cookie: cookieState })
    }
  }

  info(event: string, context?: Record<string, unknown>) {
    this.log('INFO', event, context)
  }

  warn(event: string, context?: Record<string, unknown>) {
    this.log('WARN', event, context)
  }

  error(event: string, error: Error, context?: Record<string, unknown>) {
    this.log('ERROR', event, context, error)
  }

  debug(event: string, context?: Record<string, unknown>) {
    this.log('DEBUG', event, context)
  }

  trace(event: string, context?: Record<string, unknown>) {
    this.log('TRACE', event, context)
  }

  getLogs(): AuthDebugLog[] {
    return this.logs
  }

  getCookieHistory(): CookieState[] {
    return this.cookieHistory
  }

  clearLogs() {
    this.logs = []
    this.cookieHistory = []
  }
}

export const authDebug = AuthDebugger.getInstance() 