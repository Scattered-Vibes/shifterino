# Providers Architecture

This directory contains the application's context providers following Next.js 14 best practices.

## Provider Structure

```
providers/
├── root-provider.tsx      # Root provider that wraps all other providers
├── supabase-provider.tsx  # Supabase client and authentication state
└── theme-provider.tsx     # Theme management
```

## Provider Hierarchy

The providers are nested in the following order (from outside to inside):
1. QueryClientProvider (React Query)
2. ThemeProvider (Theme management)
3. SupabaseProvider (Authentication and database)

## Usage Guidelines

### Root Provider
- Entry point for all application providers
- Handles provider composition
- Used in the root layout

```tsx
// app/layout.tsx
import { Providers } from './providers/root-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Supabase Provider
- Manages Supabase client instance
- Handles authentication state
- Provides user context
- Manages auth-related navigation

```tsx
// Using Supabase context
import { useSupabase } from '@/providers/supabase-provider'

function MyComponent() {
  const { supabase, user } = useSupabase()
  // Use supabase client or user data
}
```

### Theme Provider
- Manages color theme state
- Handles system theme preferences
- Provides theme switching functionality

```tsx
// Using theme context
import { useTheme } from 'next-themes'

function MyComponent() {
  const { theme, setTheme } = useTheme()
  // Use or modify theme
}
```

## Best Practices

1. **Client Components**
   - All providers must be client components
   - Mark with 'use client' directive
   - Keep provider logic minimal

2. **State Management**
   - Use providers for global state only
   - Prefer local state when possible
   - Consider performance implications

3. **Error Handling**
   - Implement error boundaries
   - Provide meaningful error messages
   - Handle edge cases gracefully

4. **Type Safety**
   - Use TypeScript for all providers
   - Define clear interfaces
   - Export type definitions

5. **Performance**
   - Minimize provider nesting
   - Use context splitting when appropriate
   - Implement memoization where beneficial

## Adding New Providers

When adding a new provider:

1. Create the provider file in this directory
2. Mark as 'use client' if needed
3. Add to root-provider.tsx in appropriate order
4. Document the provider's purpose and usage
5. Add type definitions
6. Include error handling
7. Add to this README 