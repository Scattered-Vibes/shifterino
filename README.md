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
│   │   ├── actions/                   # Auth server actions and handlers
│   │   ├── auth-error/                # Authentication error pages
│   │   ├── callback/                  # OAuth callback handlers
│   │   ├── components/                # Shared auth UI components
│   │   ├── login/                     # Login page with form and actions
│   │   ├── reset-password/            # Password reset flow
│   │   ├── signup/                    # Signup flow with email verification
│   │   └── update-password/           # Password update functionality
│   ├── (dashboard)/                   # Main application dashboard
│   │   ├── employees/                 # Employee management
│   │   ├── manage/                    # Schedule management (swaps, overtime)
│   │   ├── overview/                  # Schedule overview and analytics
│   │   ├── profile/                   # User profile management
│   │   ├── requirements/              # Staffing requirements configuration
│   │   ├── schedules/                 # Schedule views (calendar/list)
│   │   ├── settings/                  # Application settings
│   │   ├── shift-options/             # Shift pattern management
│   │   └── time-off/                  # Time-off request management
│   ├── api/                           # API route handlers
│   ├── hooks/                         # Custom React hooks
│   │   ├── client/                    # Client-side hooks (state, UI)
│   │   └── server/                    # Server-side data hooks
│   ├── lib/                           # Shared utilities and helpers
│   │   ├── scheduling/                # Core scheduling algorithms
│   │   ├── supabase/                  # Supabase client instances
│   │   └── validations/               # Zod schema validations
│   └── layout.tsx                     # Root application layout
├── components/                        # Shared UI components
│   └── ui/                           # Shadcn UI components
├── providers/                        # Application context providers
│   ├── auth-provider.tsx             # Authentication context
│   └── supabase-provider.tsx         # Supabase client context
├── public/                           # Static assets
├── scripts/                          # Database setup and seeding
├── supabase/                         # Supabase configuration
│   ├── migrations/                  # Database schema migrations
│   ├── seed.sql                     # Initial test data
│   ├── config.toml                 # Local Supabase config
│   └── tests/                       # Database constraint tests
├── types/                           # TypeScript definitions
│   ├── models/                      # Database model types
│   ├── scheduling/                  # Scheduling domain types
│   └── supabase/                    # Generated database types
├── utils/                           # Utility functions
│   ├── scheduling/                  # Schedule generation helpers
│   ├── staffing/                    # Staffing requirement checks
│   └── time-off/                    # Time-off conflict detection
└── __tests__/                       # Test suites
    ├── e2e/                         # Playwright end-to-end tests
    ├── integration/                 # Integration test suites
    └── unit/                        # Component/utility unit tests
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