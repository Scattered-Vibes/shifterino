# Scheduling Component Architecture

This directory implements the scheduling functionality following Next.js 14 best practices for component organization.

## Directory Structure

```
app/schedule/                    # Schedule route and server components
├── _components/                # Private components for this route
│   ├── schedule-manager.tsx    # Main scheduling logic
│   ├── shift-calendar.tsx      # Calendar view for shifts
│   ├── shift-update-form.tsx   # Form for updating shifts
│   └── staffing-requirements.tsx # Staffing requirement display
├── shift-swaps/               # Shift swap functionality
│   └── page.tsx              # Shift swap page
└── page.tsx                  # Main schedule page

components/schedule/           # Shared client components
└── schedule-calendar.tsx     # Reusable calendar component
```

## Component Separation

### Server Components (`app/schedule/`)
- Route-specific components
- Server-side rendering
- Data fetching
- Business logic

### Client Components (`components/schedule/`)
- Shared UI components
- Interactive elements
- Client-side state
- Reusable across routes

## Component Types

### Private Components (`_components/`)
- Used only within schedule route
- Specific to scheduling features
- Not meant for reuse
- Can be server or client components

### Shared Components (`components/schedule/`)
- Reusable across the app
- Pure UI components
- Client-side interactivity
- Generic scheduling patterns

## Usage Guidelines

### Server Components
```tsx
// app/schedule/_components/staffing-requirements.tsx
export default function StaffingRequirements() {
  // Server-side data fetching
  // Business logic
  // Render UI
}
```

### Client Components
```tsx
// components/schedule/schedule-calendar.tsx
'use client'

export function ScheduleCalendar({ events, onEventClick }) {
  // Client-side interactivity
  // UI state management
  // Event handling
}
```

## Best Practices

1. **Component Location**
   - Route-specific → `app/schedule/_components/`
   - Reusable → `components/schedule/`
   - Server-first → Use server components by default
   - Client when needed → Mark with 'use client'

2. **Data Flow**
   - Fetch data in server components
   - Pass data down as props
   - Use client components for interactivity
   - Keep state close to usage

3. **Performance**
   - Minimize client components
   - Use streaming where possible
   - Implement proper loading states
   - Handle errors gracefully

4. **Code Organization**
   - Group related components
   - Clear file naming
   - Consistent exports
   - Type safety

## Adding New Components

When adding a new component:

1. Determine the scope:
   - Route-specific vs. shared
   - Server vs. client needs
   - Reusability requirements

2. Choose the location:
   - Route-specific → `_components/`
   - Shared → `components/schedule/`
   - Client-side → Mark with 'use client'

3. Follow the pattern:
   - Use TypeScript
   - Add documentation
   - Include tests
   - Consider performance

## Component Checklist

- [ ] Correct directory placement
- [ ] Proper client/server designation
- [ ] TypeScript interfaces
- [ ] Error handling
- [ ] Loading states
- [ ] Tests
- [ ] Documentation

## Related Documentation

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Component Architecture](../../docs/architecture.md)
- [Testing Strategy](../../docs/testing.md)
- [Performance Guidelines](../../docs/performance.md) 