# 911 Dispatch Center Scheduling System

A comprehensive scheduling system built with Next.js 14, Supabase, and Shadcn UI for managing 24/7 911 dispatch center staffing.

## Features

- **Authentication & Authorization**
  - Secure login with Supabase Auth (leveraging SSR)
  - Role-based access (Supervisors vs. Employees)
  - Protected routes and API endpoints

- **Schedule Management**
  - Real-time staffing level monitoring
  - Shift assignment and management
  - Support for multiple shift patterns:
    - Pattern A: Four consecutive 10-hour shifts
    - Pattern B: Three consecutive 12-hour shifts plus one 4-hour shift
  - Automatic supervisor coverage verification

- **Time-Off Management**
  - Request submission and approval workflow
  - Calendar integration
  - Conflict detection

- **Staff Management**
  - Employee profiles and preferences
  - Shift pattern assignment
  - Weekly hours tracking and overtime management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI
- **Backend**: Supabase (Database, Auth, Real-time)
- **Authentication**: Supabase Auth with SSR (via @supabase/ssr)
- **Styling**: Tailwind CSS with custom components

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- Supabase account
- Git

### Environment Variables

Create a `.env.local` file with:NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/911-dispatch-scheduler.git
   cd 911-dispatch-scheduler
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   Note: Do not use @supabase/auth-helpers-nextjs as it is now deprecated in favor of @supabase/ssr.
   - Create a new Supabase project.
   - Run the migration in `supabase/migrations/20250214_initial_schema.sql`.
   - Configure your authentication providers.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

Below is the updated project structure, reflecting our latest architectural improvements and adherence to Next.js 14 best practices with Supabase SSR:

```bash
.
├── README.md              // Project overview and documentation
├── STATUS.md              // Project status, changelog, or progress updates
├── app                    // Next.js application directory containing pages, routes, and API code
│   ├── (auth)             // Authentication-related flows and pages
│   │   ├── complete-profile   // Folder for completing user profile setup
│   │   │   └── page.tsx         // Page component for completing a user's profile
│   │   ├── login              // Folder for the login workflow
│   │   │   ├── actions.ts       // Defines actions and handlers for user login
│   │   │   └── page.tsx         // Login page component UI
│   │   ├── signout            // Folder for signout operations
│   │   │   └── actions.ts       // Action file to process user signout
│   │   └── signup             // Folder for user registration flow
│   │       ├── actions.ts       // Contains actions to handle user signup
│   │       ├── check-email      // Folder for email verification during signup
│   │       │   └── page.tsx     // Page for checking email verification status
│   │       └── page.tsx         // Signup page component UI
│   ├── (dashboard)         // Protected dashboard area for authenticated users
│   │   ├── dashboard           // Folder for main dashboard view
│   │   │   └── page.tsx         // Dashboard page component UI
│   │   ├── employees           // Folder for managing employee-related data
│   │   │   └── page.tsx         // Employee management page component
│   │   ├── layout.tsx          // Layout component for structuring dashboard pages
│   │   ├── manage              // Folder for scheduling and management functionalities
│   │   │   ├── components       // Components specific to management operations
│   │   │   │   ├── ScheduleManager.tsx   // Component for creating and editing schedules
│   │   │   │   ├── StaffList.tsx           // Component for managing and viewing staff lists
│   │   │   │   ├── StaffingOverview.tsx    // Component for real-time staffing insights
│   │   │   │   └── TimeOffRequests.tsx     // Component for processing time off requests
│   │   │   └── page.tsx          // Main page component for the management section
│   │   └── page.tsx            // Root page component for the dashboard section
│   ├── actions.ts           // Global actions file for handling app-wide logic
│   ├── api                  // Folder for API route definitions
│   │   └── v1              // Version 1 of API endpoints
│   ├── auth                 // Additional authentication-related utilities and routes
│   │   ├── callback           // Folder for managing OAuth callback routes
│   │   │   └── route.ts       // Route handler for OAuth provider callbacks
│   │   ├── refresh-session    // Folder for session refresh endpoints
│   │   │   └── route.ts       // Route handler for refreshing user sessions
│   │   └── signup             // Supplementary folder for signup-related actions
│   │       └── actions.ts       // Additional actions to support the signup process
│   ├── favicon.ico          // Favicon icon file for the website
│   ├── globals.css          // Global CSS styles for the application
│   ├── layout.tsx           // Main layout component that wraps app pages
│   ├── lib                  // Library folder for external integrations and utilities
│   │   └── supabase         // Supabase configuration and integration files
│   │       ├── client.ts      // Client-side configuration for Supabase
│   │       └── server.ts      // Server-side Supabase helpers and configuration
│   └── page.tsx             // Root page component for the Next.js app
├── components             // Reusable React UI components and error boundary wrappers
│   ├── ErrorBoundary.tsx    // Component for catching and displaying UI errors
│   ├── providers            // Folder for context providers
│   │   └── AuthProvider.tsx   // Provides authentication context to the app
│   └── ui                 // Base UI components built with Shadcn UI
│       ├── alert.tsx         // Alert component for user notifications
│       ├── button.tsx        // Button component for interactive elements
│       ├── calendar.tsx      // Calendar component for date selection
│       ├── card.tsx          // Card component for content grouping and layout
│       ├── dialog.tsx        // Dialog/modal component for overlay interactions
│       ├── errors.tsx        // Component to display error messages
│       ├── form.tsx          // Form component to handle user inputs
│       ├── input.tsx         // Input field component for forms
│       ├── label.tsx         // Label component for form inputs
│       ├── layout-shell.tsx  // Layout shell for wrapping UI sections
│       ├── nav.tsx           // Navigation component for site routing
│       ├── select.tsx        // Select (dropdown) component for forms
│       ├── sheet.tsx         // Sheet component for slide-over panels
│       ├── sidebar.tsx       // Sidebar component for additional navigation
│       ├── skeleton.tsx      // Skeleton loader component for placeholder UI
│       ├── skeletons.tsx     // Variations of skeleton loaders for diverse uses
│       ├── table.tsx         // Table component for displaying data in rows/columns
│       ├── tabs.tsx          // Tabs component for organizing content into tabs
│       ├── toast.tsx         // Toast component for transient notifications
│       ├── toaster.tsx       // Container component for managing multiple toasts
│       └── tooltip.tsx       // Tooltip component for contextual information
├── components.json        // JSON configuration or metadata for components
├── documentation          // Folder containing project documentation and guides
│   ├── app_flow_document.md           // Document describing the application's flow
│   ├── backend_structure_document.md  // Detailed description of the backend architecture
│   ├── cursorrules_file.md            // Guidelines for cursor handling and navigation
│   ├── file_structure_document.md     // Explanation of the project's file structure
│   ├── frontend_guidelines_document.md  // Best practices for frontend development
│   ├── implementation_plan.md         // Project implementation plan and milestones
│   ├── project_requirements_document.md  // Document outlining project requirements
│   ├── project_structure.md             // Summary of overall project structure
│   ├── scheduling_logic_document.md     // Document detailing the scheduling logic used
│   ├── starter_tech_stack_document.md    // Initial technology stack overview
│   └── tech_stack_document.md            // Detailed explanation of the project's tech stack
├── eslint.config.mjs       // ESLint configuration file in ECMAScript module format
├── hooks                   // Custom React hooks for shared logic and reusability
│   ├── use-toast.ts         // Hook to manage toast notifications
│   ├── useAuth.ts           // Hook for authentication state management
│   └── useSupabase.ts       // Hook for interacting with Supabase services
├── lib                    // Additional libraries and utility integrations
│   ├── supabase            // Folder for Supabase related utilities
│   │   ├── client.ts         // Client-side setup for Supabase
│   │   ├── server.ts         // Server-side helper functions for Supabase
│   │   └── service.ts        // Service layer for interacting with Supabase APIs
│   └── utils.ts           // General utility functions used throughout the project
├── middleware.ts         // Middleware configuration for processing requests in Next.js
├── next-env.d.ts         // TypeScript declarations for Next.js environment globals
├── next.config.js          // Next.js configuration file in JavaScript
├── next.config.ts          // Next.js configuration file in TypeScript
├── package-lock.json       // Lockfile for npm dependency versions
├── package.json           // Project manifest with dependencies, scripts, and metadata
├── postcss.config.js       // PostCSS configuration file in JavaScript
├── postcss.config.mjs      // PostCSS configuration file in ECMAScript module format
├── public                // Public folder for static assets accessible to the browser
│   ├── file.svg           // Generic SVG file asset
│   ├── globe.svg          // SVG icon representing a globe
│   ├── next.svg           // SVG logo for Next.js framework
│   ├── vercel.svg         // SVG logo for Vercel hosting platform
│   └── window.svg         // SVG icon representing a window
├── supabase             // Supabase configuration and database management folder
│   ├── config.toml         // TOML configuration file for Supabase settings
│   ├── migrations          // Folder containing SQL migration scripts
│   │   ├── 20250203192245_auth_functions.sql   // SQL script for setting up authentication functions
│   │   ├── 20250203192246_initial_schema.sql   // SQL script for creating the initial database schema
│   │   └── 20250214_create_individual_shifts.sql   // SQL script for configuring individual shift records
│   └── seed.sql            // SQL seed file to initialize the database with sample or default data
├── tailwind.config.js      // Tailwind CSS configuration file in JavaScript
├── tailwind.config.ts      // Tailwind CSS configuration file in TypeScript
├── tsconfig.json           // TypeScript configuration file for the project
├── tsconfig.tsbuildinfo    // TypeScript build info file for incremental build optimization
├── types                // Folder for global TypeScript type definitions
│   └── database.ts         // Type definitions for the database schema and related models
└── utils                // Utility helper functions across the project
    └── supabase          // Folder for Supabase-specific utility functions
        └── middleware.ts   // Middleware functions for integrating Supabase within the project

### Key Directories

- app/(auth)/: Contains authentication flows (login, signup, email verification, password recovery) with SSR support.
- app/(dashboard)/: Houses protected pages, including the main dashboard, staff management, and scheduling operations.
- app/_types/: Application-specific TypeScript definitions.
- components/ui/: Reusable UI components built with Shadcn.
- hooks/: Custom React hooks for shared functionality.
- lib/supabase/: Supabase configuration that leverages @supabase/ssr for enhanced server-side authentication.
- types/: Global TypeScript definitions.
- docs/: Comprehensive project documentation and developer guides.
- supabase/: Database schema, migration files, and Supabase configuration.
- styles/: Global styles and Tailwind CSS configuration.

### Route Groups

- (auth): Authentication-related pages with a shared layout and SSR-enabled handlers.
- (dashboard): Protected dashboard pages accessible only to authenticated users.
- api/v1: Versioned API endpoints for backend operations.
- auth/callback: Routes handling OAuth provider callbacks.

### Component Organization

- components/ui/: Contains the base Shadcn UI components.
- (dashboard)/manage/components/: Holds components specific to scheduling and management:
  - ScheduleManager.tsx: For schedule creation and editing.
  - StaffList.tsx: For staff management.
  - StaffingOverview.tsx: For real-time staffing overview.
  - TimeOffRequests.tsx: For administrating time-off requests.

### Authentication Flow

- /login: User login interface with Supabase SSR integration.
- /signup: New user registration.
- /signup/check-email: Email verification workflow.
- /auth/callback: OAuth provider callback handling with SSR.

## Development

### Available Commands

- `npm run dev`: Start the development server
- `npm run build`: Build the production bundle
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint
- `npm run type-check`: Run the TypeScript compiler

### Database Management

- Start local Supabase: `supabase start`
- Apply migrations: `supabase db reset`
- Generate types: `supabase gen types typescript --local > types/database.ts`

## Deployment

1. Set up environment variables on your hosting platform.
2. Configure your Supabase production project.
3. Deploy using your preferred platform (e.g., Vercel):

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Next.js team for the excellent framework
- Supabase team for the backend infrastructure
- Shadcn UI for the component library
