# 911 Dispatch Center Scheduling System

A comprehensive scheduling system built with Next.js 14, TypeScript, Supabase (using Supabase SSR), and Shadcn UI for managing 24/7 911 dispatch center staffing.

## Features

- **Authentication & Authorization**
  - Secure login leveraging Supabase Auth via SSR (using the modern @supabase/ssr module)
  - Role-based access (Supervisors vs. Employees)
  - Protected routes and API endpoints integrated within Next.js 14 App Router

- **Schedule Management**
  - Real-time staffing level monitoring
  - Shift assignment and management with support for multiple shift patterns:
    - **Pattern A:** Four consecutive 10-hour shifts
    - **Pattern B:** Three consecutive 12-hour shifts plus one 4-hour shift
  - Automatic supervisor coverage verification

- **Time-Off Management**
  - Request submission and approval workflow
  - Calendar integration with interactive scheduling views
  - Conflict detection to ensure balanced staffing

- **Staff Management**
  - Employee profiles and preferences management
  - Shift pattern assignment for streamlined scheduling
  - Weekly hours tracking and overtime management

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components:** Shadcn UI (with modern shadcn commands) and Radix UI for accessible components
- **Backend:** Supabase (Database, Real-time updates, and Auth via Supabase SSR)
- **Authentication:** Secure user authentication using Supabase Auth with SSR, leveraging the new @supabase/ssr module for robust cookie and session management
- **Styling:** Tailwind CSS with custom configurations and reusable Shadcn UI components

## Project Structure

Below is the updated project structure, reflecting our latest architectural improvements and adherence to Next.js 14 best practices with integrated Supabase SSR:

```bash                                                                  
.                         // Root directory of the project
├── README.md             // Project documentation and usage guide
├── app                   // Next.js application directory containing pages, routes, and related logic
│   ├── (auth)           // Authentication routes and pages
│   │   ├── auth-error   // Handling authentication errors
│   │   │   └── page.tsx // Component displaying authentication error messages
│   │   ├── complete-profile  // Page for completing user profiles post-signup
│   │   │   └── page.tsx // Component for completing user profiles
│   │   ├── login        // Login functionality and related UI components
│   │   │   ├── actions.ts     // Server-side actions to process login attempts
│   │   │   ├── login-form.tsx // Login form component for user credentials
│   │   │   └── page.tsx       // Main login page component
│   │   ├── reset-password   // Password reset process and interface
│   │   │   └── page.tsx     // Component for resetting user passwords
│   │   ├── signout      // Sign-out functionality implementation
│   │   │   └── actions.ts // Action handler for signing out users
│   │   └── signup       // User registration and signup process
│   │       ├── actions.ts     // Server-side actions handling new user registrations
│   │       ├── check-email    // Email verification step during signup
│   │       │   └── page.tsx   // Component to verify a user's email address
│   │       ├── page.tsx       // Main signup page component
│   │       └── signup-form.tsx// Signup form component for user registration input
│   ├── (dashboard)      // Dashboard routes and components for authenticated users
│   │   ├── employees    // Employee management section within the dashboard
│   │   │   └── page.tsx // Component to display and manage employee data
│   │   ├── layout.tsx   // Layout component providing structure for dashboard pages
│   │   ├── manage       // Management section for scheduling and time-off operations
│   │   │   ├── actions  // Action handlers specific to management functionalities
│   │   │   │   └── time-off.ts // Handler for processing time-off requests
│   │   │   ├── actions.ts    // General management action handlers
│   │   │   ├── components    // Reusable UI components for management interfaces
│   │   │   │   ├── RealtimeSchedule.tsx     // Component displaying real-time scheduling updates
│   │   │   │   ├── ScheduleManager.tsx        // Interface for managing schedules
│   │   │   │   ├── StaffList.tsx              // Component listing staff members
│   │   │   │   ├── StaffingOverview.tsx       // Component providing an overview of staffing levels
│   │   │   │   ├── TimeOffRequestForm.tsx     // Form for submitting time-off requests
│   │   │   │   └── TimeOffRequests.tsx        // Component listing submitted time-off requests
│   │   │   └── page.tsx      // Main page component for the management section
│   │   ├── overview     // Dashboard overview presenting key summaries and statistics
│   │   │   └── page.tsx // Component for the overview page
│   │   ├── profile      // User profile management section
│   │   │   ├── actions.ts    // Actions for updating and managing profiles
│   │   │   ├── complete      // Sub-route for profile completion processes
│   │   │   ├── error.tsx     // Component for handling profile-related errors
│   │   │   ├── page.tsx      // Main user profile page component
│   │   │   └── profile-form.tsx // Form component for editing user profiles
│   │   ├── schedules    // Section for viewing and managing work schedules
│   │   │   └── page.tsx // Component for the schedules page
│   │   └── time-off     // Time-off management area within the dashboard
│   │       └── page.tsx // Main component for managing time-off requests
│   ├── actions          // Global action handlers for app-level functionalities
│   │   └── auth.ts     // Authentication-related action handlers
│   ├── actions.ts       // Root-level action definitions for the Next.js app
│   ├── api              // API routes handling server-side logic and endpoints
│   │   └── auth         // Authentication-related API endpoints
│   │       ├── callback        // Endpoint for handling authentication callbacks
│   │       │   └── route.ts    // API route processing auth callback requests
│   │       ├── cleanup         // Endpoint for cleaning up authentication sessions
│   │       │   └── route.ts    // API route for session cleanup operations
│   │       ├── force-signout   // Endpoint to enforce user sign-out
│   │       │   └── route.ts    // API route handling forced sign-out requests
│   │       ├── session         // Session management endpoints
│   │       │   └── refresh      // Sub-route for session refresh operations
│   │       │       └── route.ts // API route to refresh user sessions
│   │       └── signout         // Endpoint for signing out users via API
│   │           └── route.ts    // API route processing sign-out actions
│   ├── error              // Global error handling pages for the app
│   │   └── page.tsx      // Component to display error messages
│   ├── favicon.ico       // Favicon icon for the application
│   ├── globals.css       // Global CSS styles applied across the app
│   ├── hooks             // Custom React hooks utilized throughout the app
│   ├── layout.tsx        // Root layout component defining the app structure
│   ├── lib               // Library of helper functions and configurations
│   │   ├── auth.ts      // Utility functions for managing authentication
│   │   └── supabase     // Supabase integration utilities and configurations
│   │       ├── client.ts   // Client-side configuration for Supabase
│   │       └── server.ts   // Server-side Supabase integration utilities
│   ├── not-found.tsx     // Custom 404 Not Found page component
│   ├── page.tsx          // Main landing page component for the application
│   └── styles            // Additional style files specific to the app
├── components           // Reusable UI components shared across the project
│   ├── ErrorBoundary.tsx   // Component for catching and displaying UI errors
│   ├── auth               // UI components related to authentication
│   │   ├── login-form.tsx  // Login form presentation component
│   │   └── signup-form.tsx // Signup form presentation component
│   ├── dashboard          // Dashboard-specific UI components
│   │   ├── dashboard-header.tsx  // Header component for the dashboard
│   │   ├── dashboard-shell.tsx   // Layout shell for dashboard pages
│   │   ├── nav.tsx         // Navigation component for dashboard navigation
│   │   └── user-nav.tsx    // User navigation component within the dashboard
│   ├── layout             // Client-side layout components
│   │   └── client-layout.tsx // Layout component for client-side views
│   ├── profile            // Profile-related UI components
│   │   └── profile-form.tsx    // Form component for editing user profiles
│   ├── providers          // Context providers for state or authentication management
│   │   └── AuthProvider.tsx   // Provider component managing authentication state
│   ├── schedule           // UI components for scheduling functionality
│   │   └── schedule-calendar.tsx // Calendar component for displaying schedules
│   └── ui                 // General-purpose UI components and widgets
│       ├── alert.tsx            // Alert component for notifications
│       ├── avatar.tsx           // Avatar component for user icons
│       ├── button.tsx           // Custom button element
│       ├── calendar.tsx         // Calendar widget component for date selection
│       ├── card.tsx             // Card component for content grouping
│       ├── dialog.tsx           // Dialog/modal component for interactive overlays
│       ├── dropdown-menu.tsx    // Dropdown menu component for displaying options
│       ├── errors.tsx           // Error display component for form and UI errors
│       ├── form.tsx             // Generic form component for consistent styling
│       ├── header.tsx           // Header component for section titles
│       ├── input.tsx            // Input field component for forms
│       ├── label.tsx            // Label component associated with inputs
│       ├── layout-shell.tsx     // Shell layout component for overall page structure
│       ├── loading-spinner.tsx  // Spinner component indicating loading states
│       ├── main-nav.tsx         // Main navigation component for the UI
│       ├── nav.tsx              // Alternative navigation bar component
│       ├── select.tsx           // Select/dropdown component for form inputs
│       ├── sheet.tsx            // Sheet component for sidebar or modal panels
│       ├── side-nav.tsx         // Side navigation component for additional menus
│       ├── sidebar.tsx          // Sidebar component for layout navigation
│       ├── sign-out-button.tsx  // Button component that triggers user sign-out
│       ├── skeleton.tsx         // Skeleton loader component for placeholder content
│       ├── skeletons.tsx        // Collection of skeleton components for various UIs
│       ├── table.tsx            // Table component for displaying structured data
│       ├── tabs.tsx             // Tabs component for content segmentation
│       ├── textarea.tsx         // Textarea component for multi-line text input
│       ├── toast.tsx            // Toast notification UI component
│       ├── toaster.tsx          // Container component managing multiple toasts
│       ├── tooltip.tsx          // Tooltip component providing hover hints
│       ├── use-toast.ts         // Custom hook for managing toast notifications
│       └── user-nav.tsx         // UI component for user-specific navigation actions
├── components.json    // JSON metadata or configuration for UI components
├── docs               // Project documentation and technical guides
│   ├── app_flow_document.md              // Document outlining the application flow
│   ├── backend_structure_document.md     // Details of the backend architecture and structure
│   ├── file_structure_document.md        // Explanation of the project's file structure
│   ├── frontend_guidelines_document.md   // Guidelines for frontend development best practices
│   ├── implementation_plan.md            // Step-by-step implementation plan document
│   ├── project_requirements_document.md   // Document detailing project requirements
│   ├── project_structure.md              // Overview document of the project structure
│   ├── scheduling_logic_document.md      // Documentation of the scheduling logic and rules
│   ├── schema_guide.md                    // Guide to the database schema design
│   ├── starter_tech_stack_document.md     // Overview of the initial technology stack used
│   ├── supabase-db-overview.md            // Overview of Supabase database configuration and usage
│   └── tech_stack_document.md             // Documentation detailing the overall tech stack
├── eslint.config.mjs    // ESLint configuration file for enforcing code quality rules
├── hooks               // Additional project-level custom React hooks
│   └── use-toast.ts     // Custom hook for displaying and managing toast notifications
├── jwt_config.sql      // SQL file with JWT configuration settings for authentication
├── lib               // Shared library containing helper functions and utilities
│   ├── auth.ts         // Helper functions for authentication logic
│   ├── supabase        // Utilities for integrating with Supabase services
│   │   ├── auth.ts         // Supabase authentication utility functions
│   │   ├── client.ts       // Configuration for the Supabase client-side integration
│   │   ├── cookie-adapter.ts // Adapter for managing cookies in Supabase interactions
│   │   ├── server.ts       // Server-side utilities for Supabase integration
│   │   └── service.ts      // Service layer for communicating with Supabase
│   └── utils.ts       // General utility functions and helpers used in the project
├── middleware.ts     // Middleware handling request processing in the project
├── next-env.d.ts     // TypeScript environment definitions for Next.js
├── next.config.js    // Next.js configuration file (JavaScript)
├── next.config.ts    // Next.js configuration file (TypeScript)
├── package-lock.json // Auto-generated dependency lock file for npm
├── package.json      // Project manifest listing dependencies and scripts
├── postcss.config.js // PostCSS configuration file (JavaScript) for processing CSS
├── postcss.config.mjs // PostCSS configuration file in MJS format
├── public           // Directory for static public assets
│   ├── file.svg       // Example SVG file asset
│   ├── globe.svg      // SVG icon representing a globe
│   ├── next.svg       // Next.js logo in SVG format
│   ├── vercel.svg     // Vercel logo in SVG format
│   └── window.svg     // SVG image representing a window graphic
├── scripts          // Utility scripts to assist in development tasks
│   └── generate-types.ts // Script to generate TypeScript definitions (e.g., for Supabase)
├── supabase         // Supabase configuration, migrations, and test files
│   ├── config.toml   // Supabase configuration file
│   ├── migrations    // Database migration scripts for setting up Supabase
│   │   ├── 001_core_schema_and_auth.sql // SQL script for core schema and authentication setup
│   │   ├── 002_scheduling_schema.sql     // SQL script for creating scheduling-related schema
│   │   ├── 003_auth_sessions_and_jwt.sql   // SQL script for setting up auth sessions and JWT handling
│   │   └── 20250214_validate_session.sql   // SQL script for validating user sessions
│   ├── seed.sql     // SQL script to seed the database with initial data
│   └── tests         // Test scripts for validating Supabase database configurations
│       └── database       // Database-specific test scripts
│           ├── 00_setup.test.sql      // Test script for initial database setup
│           ├── 01_schema.test.sql       // Test script for verifying the database schema
│           ├── 02_rls_policies.test.sql // Test script for validating RLS policies
│           └── 03_business_logic.test.sql // Test script for verifying business logic operations
├── tailwind.config.js  // Tailwind CSS configuration file (JavaScript)
├── tailwind.config.ts  // Tailwind CSS configuration file (TypeScript)
├── tsconfig.json      // TypeScript configuration file for the project
├── tsconfig.tsbuildinfo // Build info file generated by the TypeScript compiler
└── types            // Directory for custom TypeScript type definitions
    └── database.ts   // Type definitions for the database schema
```

## Development

### Available Commands

- `npm run dev` – Start the development server
- `npm run build` – Build the production bundle
- `npm run start` – Launch the production server
- `npm run lint` – Run ESLint for code quality checks
- `npm run type-check` – Run the TypeScript compiler to enforce type safety

### Database Management

- Start local Supabase: `supabase start`
- Reset database (apply migrations and seed data): `supabase db reset`
- Generate type definitions: `supabase gen types typescript --local > types/database.ts`

## Deployment

1. Configure the required environment variables on your hosting platform.
2. Set up and configure your production Supabase project.
3. Deploy using your preferred platform (e.g., Vercel):

   ```bash
   npm run build
   ```

## Contributing

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request.

## License

This project is licensed under the MIT License – see the LICENSE file for details.

## Acknowledgments

- **Next.js Team:** For providing an excellent framework with modern SSR and routing capabilities.
- **Supabase Team:** For robust backend infrastructure and the new SSR integration which simplifies authentication and session management.
- **Shadcn UI & Radix UI:** For their beautifully designed and accessible UI components.
