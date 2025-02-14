# 911 Dispatch Center Scheduling System

A comprehensive scheduling system for 24/7 911 dispatch center operations, built with Next.js 14, TypeScript, and Supabase.

## Features

- 24/7 schedule coverage with minimum staffing requirements
- Shift pattern management (4x10 hours or 3x12 hours + 1x4 hours)
- Time-off request management
- Role-based access control (Manager, Supervisor, Dispatcher)
- Real-time schedule updates
- Automated schedule validation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Real-time subscriptions)
- **State Management**: Server Components + Client Hooks
- **Styling**: Tailwind CSS + Shadcn UI Components

## Project Structure

```
.
├── app/                                # Next.js 14 app directory
│   ├── (auth)/                        # Authentication routes and components
│   │   ├── actions/                   # Auth server actions
│   │   ├── login/                     # Login page and form
│   │   ├── signup/                    # Signup flow
│   │   └── components/                # Shared auth components
│   ├── (dashboard)/                   # Dashboard routes
│   │   ├── manage/                    # Schedule management
│   │   ├── overview/                  # Schedule overview
│   │   ├── profile/                   # User profile
│   │   └── requirements/              # Staffing requirements
│   ├── api/                           # API route handlers
│   ├── hooks/                         # Custom React hooks
│   │   ├── client/                    # Client-side hooks
│   │   └── server/                    # Server-side hooks
│   └── layout.tsx                     # Root layout
├── components/                        # Shared components
│   └── ui/                           # Shadcn UI components
├── lib/                              # Core utilities
│   ├── schedule/                     # Schedule logic
│   ├── supabase/                     # Supabase client/server
│   └── validations/                  # Schema validation
├── providers/                        # React context providers
├── types/                           # TypeScript types
│   ├── models/                      # Data models
│   ├── scheduling/                  # Schedule types
│   └── supabase/                    # Generated DB types
├── supabase/                        # Supabase config
│   ├── migrations/                  # Database migrations
│   ├── functions/                   # Edge functions
│   └── tests/                       # Database tests
└── __tests__/                       # Test suites
    ├── e2e/                         # End-to-end tests
    ├── integration/                 # Integration tests
    └── unit/                        # Unit tests
```

## Application Summary

This is a well-structured Next.js 14 application with modern Supabase integration, built to handle complex 911 dispatch center scheduling. Key highlights:

- Modern Stack:
  - Next.js 14 App Router
  - Supabase with SSR (@supabase/ssr)
  - TypeScript
  - Shadcn UI + Tailwind

- Architecture:
  - Clean route grouping ((auth), (dashboard))
  - Proper server/client component separation
  - Comprehensive testing (unit, integration, E2E)
  - Strong typing with generated Supabase types

Key Features:
- Complex scheduling logic
- Real-time updates
- Role-based access control
- Time-off management
- Shift swap handling

Best Practices:
- Server-side auth with Supabase SSR
- Type-safe database access
- Comprehensive error handling
- Performance optimization
- Rate limiting

The codebase follows modern Next.js and Supabase best practices, with a strong focus on type safety, testing, and maintainability. The scheduling logic is well-organized to handle complex requirements while maintaining real-time capabilities.


## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/911-dispatch-scheduler.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase project details.

4. Run database migrations:
   ```bash
   npm run supabase:migrate
   ```

5. Create test users:
   ```bash
   npm run create-test-users
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Development

### Database Migrations

- Create a new migration:
  ```bash
  npm run supabase:new name_of_migration
  ```

- Apply migrations:
  ```bash
  npm run supabase:migrate
  ```

### Testing

- Run tests:
  ```bash
  npm test
  ```

### Code Style

- Lint code:
  ```bash
  npm run lint
  ```

- Format code:
  ```bash
  npm run format
  ```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to your hosting platform of choice.

3. Run database migrations on production:
   ```bash
   npm run supabase:migrate:prod
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.