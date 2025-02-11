# Error Handling Architecture

This application implements a comprehensive error handling strategy following Next.js 14 best practices.

## Error Components

```
app/
├── error/
│   └── page.tsx         # Static error page for direct navigation
├── error.tsx           # Error boundary for route segments
└── global-error.tsx    # Root error boundary for the entire app
```

## Component Purposes

### Static Error Page (`error/page.tsx`)
- Handles direct navigation to error routes
- Provides user-friendly error information
- Offers navigation back to safe states
- Server-side rendered

### Route Error Boundary (`error.tsx`)
- Catches errors in route segments
- Preserves navigation and layout
- Provides reset functionality
- Client-side rendered with 'use client'

### Global Error Boundary (`global-error.tsx`)
- Catches critical application errors
- Handles root layout failures
- Last line of defense
- Renders minimal HTML structure
- Client-side rendered with 'use client'

## Error Handling Flow

1. Component/Route Level
   - Try/catch blocks
   - Error boundaries in components
   - Handled closest to source

2. Route Segment Level
   - `error.tsx` catches unhandled errors
   - Preserves rest of the app
   - Shows error UI for segment

3. Application Level
   - `global-error.tsx` catches critical errors
   - Renders when route error fails
   - Minimal fallback UI

## Usage Guidelines

### Component Error Handling
```tsx
try {
  // Risky operation
} catch (error) {
  // Handle locally if possible
  throw error // Let error boundary handle if needed
}
```

### Error Boundary Props
```tsx
interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}
```

### Error Messages
- Use `getUserFriendlyMessage`
- Map error codes to messages
- Show technical details in development

## Best Practices

1. **Error Isolation**
   - Use error boundaries strategically
   - Prevent error propagation
   - Preserve app functionality

2. **User Experience**
   - Clear error messages
   - Recovery options
   - Preserve navigation
   - Maintain context

3. **Development**
   - Detailed error info in development
   - Error tracking integration
   - Logging strategy
   - Error reporting

4. **Recovery**
   - Provide reset functionality
   - Clear error states
   - Data revalidation
   - State cleanup

## Adding New Error Handlers

When adding error handling:

1. Determine appropriate level
2. Use existing boundaries when possible
3. Add specific error messages
4. Include recovery options
5. Test error scenarios
6. Document new handlers

## Error Reporting

```tsx
useEffect(() => {
  // Log to error reporting service
  console.error('Error:', error)
  // Add your error reporting logic here
}, [error])
```

## Related Documentation

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Error Codes](../lib/utils/error-codes.ts)
- [Error Messages](../lib/utils/error-handler.ts) 