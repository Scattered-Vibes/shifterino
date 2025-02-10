# Security Documentation

This document outlines the security measures implemented in the 911 Dispatch Center Scheduling System.

## Authentication

### Supabase Auth Configuration

We use Supabase Auth with the following configuration:

```typescript
// Using @supabase/ssr for Next.js 14 (App Router)
import { createClient } from '@supabase/ssr'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      // Secure cookie configuration
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string) {
        cookieStore.delete(name)
      },
    },
  }
)
```

Key Security Features:
- Secure cookie-based session management
- PKCE flow for OAuth
- Automatic token refresh
- Session invalidation on security events

### Session Management

- Sessions are managed server-side
- 30-day maximum session duration
- Automatic cleanup of expired sessions
- Force sign-out capability for security incidents

## Authorization

### Role Hierarchy

1. **Dispatcher (base role)**
   - View own schedule and data
   - Submit time-off requests
   - Update actual shift times

2. **Supervisor**
   - All dispatcher permissions
   - Manage team schedules
   - Approve/reject time-off requests
   - View team analytics

3. **Manager**
   - Full system access
   - Configure staffing requirements
   - Manage user roles
   - Access audit logs

### Middleware Authorization

```typescript
// Example of role-based middleware
export async function requireManager(): Promise<AuthResult> {
  const auth = await requireAuth()
  if (auth.role !== 'manager') {
    throw new Error('Manager role required')
  }
  return auth
}
```

## Row Level Security (RLS)

### Core Tables

1. **Employees Table**
```sql
-- Users can view their own record
CREATE POLICY "employees_select_own" ON public.employees
  FOR SELECT USING (auth_id = auth.uid());

-- Supervisors can view team members
CREATE POLICY "employees_select_supervisor" ON public.employees
  FOR SELECT USING (
    is_supervisor_or_above()
    AND id IN (SELECT employee_id FROM public.get_team_members())
  );
```

2. **Schedules Table**
```sql
-- Users can view own schedules
CREATE POLICY "schedules_select_own" ON public.schedules
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE auth_id = auth.uid())
  );
```

### Helper Functions

```sql
-- Manager role check
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE auth_id = auth.uid()
    AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## API Security

### Rate Limiting

```typescript
const RATE_LIMITS = {
  default: {
    maxRequests: 50,
    windowMs: 60 * 1000 // 1 minute
  },
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000
  },
  admin: {
    maxRequests: 20,
    windowMs: 60 * 1000
  }
}
```

Implementation:
- Redis-based rate limiting
- IP-based tracking
- Configurable limits per route
- Automatic retry headers

### API Route Protection

```typescript
// Example of protected API route
export async function GET() {
  try {
    // Verify manager role
    await requireManager()
    
    // Rate limiting
    const rateLimitResult = await rateLimit(...)
    if (rateLimitResult) return rateLimitResult
    
    // Proceed with request
  } catch (error) {
    return handleAuthError(error)
  }
}
```

## Service Role Usage

### Restrictions

The service role key (`SUPABASE_SERVICE_ROLE_KEY`) is:
- Never exposed to the client
- Only used in admin API routes
- Protected by manager role checks
- Limited to specific operations

### Best Practices

```typescript
// ❌ Don't use service role directly
const serviceClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ✅ Use admin API routes instead
async function deleteUser(userId: string) {
  const response = await fetch('/api/admin/users/${userId}', {
    method: 'DELETE'
  })
  // Handle response
}
```

## Audit Logging

### Tracked Operations

- Authentication events (login, logout, token refresh)
- Security-sensitive actions (role changes, force sign-out)
- Schedule modifications
- Requirement changes

### Log Format

```sql
CREATE TABLE public.auth_logs (
  id uuid DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  operation text NOT NULL,
  user_id uuid REFERENCES auth.users,
  details jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);
```

## Security Headers

```typescript
// Middleware security headers
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}
```

## Environment Variables

Required security-related environment variables:
```bash
# Auth
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Rate Limiting
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Security
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=your_auth_url
CLEANUP_SECRET_KEY=your_cleanup_key
```

## Security Best Practices

1. **Authentication**
   - Always use server-side auth checks
   - Implement proper session management
   - Use secure cookie settings

2. **Authorization**
   - Apply principle of least privilege
   - Use RLS policies consistently
   - Validate all user input

3. **API Security**
   - Implement rate limiting
   - Use CORS appropriately
   - Validate request bodies

4. **Data Protection**
   - Never expose sensitive data
   - Use RLS policies
   - Implement audit logging

5. **Error Handling**
   - Don't expose internal errors
   - Log security events
   - Implement graceful fallbacks

## Security Monitoring

1. **Audit Logs**
   - Monitor auth_logs table
   - Track failed login attempts
   - Review role changes

2. **Rate Limit Alerts**
   - Monitor rate limit hits
   - Track suspicious patterns
   - Implement alerting

3. **Error Tracking**
   - Monitor auth errors
   - Track API errors
   - Review security exceptions 