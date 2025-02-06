# Updated Project Structure

This document outlines the latest organization of our project with a focus on clarity, modularity, and efficient grouping. The structure detailed below is designed to support maintainable code and provide intuitive URL paths.

In this updated design, the home page is served at `/` and the settings page at `/settings`, even though both reside within the `(dashboard)` route group. This approach offers several advantages:
- Enhanced Separation of Concerns: Related pages are logically grouped without exposing internal structure in the public URL.
- Optimized Nested Layouts: Shared layouts, metadata, and loading states can be applied seamlessly across grouped pages.
- Clean and Intuitive URLs: Grouping folders are used solely for code organization, keeping URL paths simple.

Key File Structure:
```bash
.                                // Root directory of the project
├── README.md                   // Project overview and instructions
├── app                         // Main application source code (Next.js pages, API routes, etc.)
│   ├── (auth)                  // Authentication group: pages and logic for user sign-in/up flows
│   │   ├── auth-error          // Authentication error display folder
│   │   │   └── page.tsx        // Page component for displaying authentication errors
│   │   ├── complete-profile    // Page prompting users to complete their profile
│   │   │   └── page.tsx        // Component rendering the complete profile page
│   │   ├── login               // Login functionality: handles user login process
│   │   │   ├── actions.ts      // Server-side actions for login operations
│   │   │   ├── login-form.tsx  // Client-side component rendering the login form
│   │   │   └── page.tsx        // Login page component serving the login interface
│   │   ├── reset-password      // Password reset feature for users
│   │   │   └── page.tsx        // Component displaying the reset password page
│   │   ├── signout             // Signout functionality for logging users out
│   │   │   └── actions.ts      // Server-side action handling user signout
│   │   └── signup              // Signup process for new user registration
│   │       ├── actions.ts      // Server-side actions to process user signup
│   │       ├── check-email     // Email verification process during signup
│   │       │   └── page.tsx    // Page component to verify user's email address
│   │       ├── page.tsx        // Main signup page component
│   │       └── signup-form.tsx // Component rendering the signup form
│   ├── (dashboard)             // Dashboard group: contains user dashboard pages and components
│   │   ├── employees           // Employees section: manage and display employee information
│   │   │   └── page.tsx        // Component for the employees page
│   │   ├── layout.tsx          // Shared layout for all dashboard pages
│   │   ├── manage              // Management section: administrative tools and tasks
│   │   │   ├── actions         // Folder for management-specific server actions
│   │   │   │   └── time-off.ts // Server action handling time-off requests
│   │   │   ├── actions.ts      // Additional management actions for admin tasks
│   │   │   ├── components      // UI components specific to management functionality
│   │   │   │   ├── RealtimeSchedule.tsx    // Component displaying realtime scheduling information
│   │   │   │   ├── ScheduleManager.tsx       // Interface for managing schedules
│   │   │   │   ├── StaffList.tsx               // Component listing staff members
│   │   │   │   ├── StaffingOverview.tsx        // Overview of staffing details
│   │   │   │   ├── TimeOffRequestForm.tsx       // Form for submitting time-off requests
│   │   │   │   └── TimeOffRequests.tsx           // Component displaying submitted time-off requests
│   │   │   └── page.tsx        // Main management page component
│   │   ├── overview             // Dashboard overview section providing a summary view
│   │   │   └── page.tsx        // Overview page component rendering dashboard summaries
│   │   ├── profile              // Profile section: user-specific profile pages and forms
│   │   │   ├── actions.ts      // Server-side actions for profile updates
│   │   │   ├── error.tsx       // Component to display profile-related errors
│   │   │   ├── page.tsx        // Profile page component showcasing user details
│   │   │   └── profile-form.tsx// Form component for editing user profile information
│   │   ├── schedules            // Schedules section: displays scheduling details for users
│   │   │   └── page.tsx        // Component rendering the schedules page
│   │   └── time-off             // Time-off management: handles time-off data within the dashboard
│   │       └── page.tsx        // Component for the time-off page
│   ├── actions                 // Global actions directory for shared server-side operations
│   │   └── auth.ts           // Authentication actions available across the app
│   ├── actions.ts              // Root-level actions file for common app operations
│   ├── api                     // API routes for backend logic and integrations
│   │   └── auth                // API group for authentication-related endpoints
│   │       ├── callback        // Authentication callback handler
│   │       │   └── route.ts    // API route processing auth callbacks
│   │       ├── cleanup         // Endpoint to clean up authentication data/sessions
│   │       │   └── route.ts    // API route for cleanup operations
│   │       ├── force-signout   // Endpoint to forcibly sign out users
│   │       │   └── route.ts    // API route handling force signout requests
│   │       ├── session         // Session management endpoints
│   │       │   └── refresh     // Sub-route for refreshing user sessions
│   │       │       └── route.ts// API route for session refresh
│   │       └── signout         // Signout API group for user logout operations
│   │           └── route.ts    // API route for processing signout requests
│   ├── auth                    // Additional authentication logic outside of (auth) group
│   │   └── callback            // Callback handling for auth redirection
│   │       └── route.ts        // API route for authentication callback
│   ├── error                   // Global error handling pages
│   │   └── page.tsx          // Error page component for displaying errors
│   ├── favicon.ico             // Favicon for the application
│   ├── globals.css             // Global CSS styles applied across the app
│   ├── hooks                 // Custom React hooks for reusable logic
│   ├── layout.tsx              // Root layout component defining overall page structure
│   ├── lib                     // Library directory for utilities and third-party integrations
│   │   ├── auth.ts            // Authentication helper functions and utilities
│   │   └── supabase          // Supabase integration: configuration and helper functions
│   │       ├── client.ts     // Client-side configuration for Supabase
│   │       └── server.ts     // Server-side configuration for Supabase
│   ├── not-found.tsx           // 404 page component for unmatched routes
│   ├── page.tsx               // Home page component serving the root URL
│   ├── profile                // Additional profile-related resources
│   │   └── complete          // Folder for extended complete profile logic or pages
│   └── styles                 // Additional styles and CSS modules for the app
├── components                // Reusable UI components across the project
│   ├── ErrorBoundary.tsx     // Component to catch and display runtime errors in the UI
│   ├── auth                  // Authentication UI components
│   │   ├── login-form.tsx    // Reusable login form component
│   │   └── signup-form.tsx   // Reusable signup form component
│   ├── dashboard             // Dashboard-specific UI components
│   │   ├── dashboard-header.tsx  // Header component for dashboard pages
│   │   ├── dashboard-shell.tsx   // Shell component that wraps dashboard content
│   │   ├── nav.tsx           // Navigation component tailored for the dashboard
│   │   └── user-nav.tsx      // User navigation component within the dashboard
│   ├── layout                // Layout components for structuring pages
│   │   └── client-layout.tsx // Client-side layout component for shared page structure
│   ├── profile               // Profile-related UI components
│   │   └── profile-form.tsx  // Form component for editing user profile details
│   ├── providers             // React context providers for global state management
│   │   └── AuthProvider.tsx  // Provider component managing authentication state
│   ├── schedule              // Scheduling UI components
│   │   └── schedule-calendar.tsx // Calendar component for displaying schedule dates
│   └── ui                    // Generic UI components for common interface elements
│       ├── alert.tsx         // Alert component for displaying notifications
│       ├── avatar.tsx        // Avatar component for user profile images
│       ├── button.tsx        // Reusable button component
│       ├── calendar.tsx      // Calendar component for date display
│       ├── card.tsx          // Card component for grouping content visually
│       ├── dialog.tsx        // Dialog/modal component for user prompts
│       ├── dropdown-menu.tsx // Dropdown menu component for selections and actions
│       ├── errors.tsx        // Component to display error messages
│       ├── form.tsx          // Generic form component wrapper
│       ├── header.tsx        // Header component for titles and sections
│       ├── input.tsx         // Input component for form entries
│       ├── label.tsx         // Label component for form field descriptions
│       ├── layout-shell.tsx  // Layout shell component for framing page content
│       ├── main-nav.tsx      // Main navigation component for the application
│       ├── nav.tsx           // Generic navigation component
│       ├── select.tsx        // Select dropdown component for forms
│       ├── sheet.tsx         // Sheet component for side panels or drawers
│       ├── sidebar.tsx       // Sidebar component for supplementary navigation
│       ├── sign-out-button.tsx // Button component for user signout actions
│       ├── skeleton.tsx      // Skeleton component for loading placeholders
│       ├── skeletons.tsx     // Collection of skeleton components for various UI states
│       ├── table.tsx         // Table component for displaying tabular data
│       ├── tabs.tsx          // Tabs component for tabbed navigation interfaces
│       ├── textarea.tsx      // Textarea component for multi-line input fields
│       ├── toast.tsx         // Toast component for transient notifications
│       ├── toaster.tsx       // Toaster component managing multiple toast messages
│       ├── tooltip.tsx       // Tooltip component for contextual hints on hover
│       ├── use-toast.ts      // Custom hook to trigger toast notifications
│       └── user-nav.tsx      // Reusable user navigation component in the UI
├── components.json           // JSON configuration for components (e.g., for tooling/documentation)
├── docs                      // Documentation files in Markdown format
│   ├── app_flow_document.md           // Document outlining the application flow and UX
│   ├── backend_structure_document.md  // Document detailing backend architecture and structure
│   ├── file_structure_document.md     // Document describing the project file/folder structure
│   ├── frontend_guidelines_document.md// Guidelines for frontend development practices
│   ├── implementation_plan.md         // Document outlining the project implementation steps
│   ├── project_requirements_document.md// Document listing project requirements and specs
│   ├── project_structure.md           // Documentation of the current project structure
│   ├── scheduling_logic_document.md   // Document explaining scheduling logic and algorithms
│   ├── schema_guide.md                 // Guide for database schema design and best practices
│   ├── starter_tech_stack_document.md  // Document describing the initial choice of technology stack
│   ├── supabase-db-overview.md         // Overview of Supabase database configuration and features
│   └── tech_stack_document.md          // Document detailing the project's technology stack
├── eslint.config.mjs         // ESLint configuration file (ESM format) for code linting rules
├── hooks                     // Global custom React hooks for shared logic
│   ├── use-toast.ts          // Custom hook for triggering toast notifications
│   └── useAuth.ts            // Custom hook for managing authentication state
├── jwt_config.sql            // SQL configuration file for JWT authentication settings
├── lib                     // Library directory containing utility functions and integrations
│   ├── auth.ts              // Authentication helper functions and utilities
│   ├── supabase           // Supabase integration folder: setup and helper modules
│   │   ├── auth.ts         // Module for Supabase authentication functions
│   │   ├── client.ts       // Client-side configuration for Supabase integration
│   │   ├── cookie-adapter.ts// Utility to adapt cookies for authentication handling
│   │   ├── server.ts       // Server-side configuration for Supabase
│   │   └── service.ts      // Service layer functions for interacting with Supabase
│   └── utils.ts             // General utility functions used across the application
├── middleware.ts             // Server middleware for processing requests (e.g., auth, logging)
├── next-env.d.ts             // Type declarations for Next.js environment variables
├── next.config.js            // Next.js configuration file in JavaScript
├── next.config.ts            // Next.js configuration file in TypeScript
├── package-lock.json         // NPM lockfile recording exact package versions
├── package.json            // Project manifest: dependencies, scripts, and meta information
├── postcss.config.js         // PostCSS configuration file in JavaScript
├── postcss.config.mjs        // PostCSS configuration file (ESM format)
├── public                    // Public directory for static assets accessible by the browser
│   ├── file.svg            // Sample SVG asset for miscellaneous use
│   ├── globe.svg           // SVG icon representing global/international themes
│   ├── next.svg            // Next.js logo in SVG format
│   ├── vercel.svg          // Vercel logo in SVG format, indicating deployment platform
│   └── window.svg          // SVG icon potentially used for UI illustrations
├── scripts                   // Utility scripts for project maintenance and automation
│   └── generate-types.ts   // Script to generate TypeScript types from schemas or API definitions
├── supabase                  // Supabase directory: configuration, migrations, seeds, and tests
│   ├── config.toml         // Supabase configuration file in TOML format
│   ├── migrations          // Database migration files for schema updates
│   │   ├── 001_core_schema_and_auth.sql    // Migration for core schema and authentication setup
│   │   ├── 002_scheduling_schema.sql         // Migration for scheduling-related database schema
│   │   ├── 003_auth_sessions_and_jwt.sql       // Migration for authentication sessions and JWT configuration
│   │   └── 20250214_validate_session.sql       // Migration for validating user sessions
│   ├── seed.sql             // SQL seed file to populate the database with initial data
│   └── tests                // Test suites for the Supabase database using SQL scripts
│       └── database         // Database-specific tests directory
│           ├── 00_setup.test.sql   // Test validating the initial database setup
│           ├── 01_schema.test.sql  // Test verifying the correctness of the database schema
│           ├── 02_rls_policies.test.sql  // Test for database RLS policies ensuring security
│           └── 03_business_logic.test.sql  // Test checking database business logic and procedures
├── tailwind.config.js        // Tailwind CSS configuration file in JavaScript
├── tailwind.config.ts        // Tailwind CSS configuration file in TypeScript
├── tsconfig.json             // TypeScript configuration file for the project
├── tsconfig.tsbuildinfo      // File storing TypeScript incremental build information
└── types                   // Type declarations for TypeScript
    └── database.ts         // TypeScript definitions for the database schema and structures
```

Understanding Route Grouping:

Route grouping in the Next.js App Router enables us to structure our codebase without altering public URL paths. By enclosing folder names in parentheses (e.g., (dashboard)), Next.js treats these directories as internal groupings. This allows shared layouts, metadata, and loading states to be applied across pages within the group while keeping the actual URL paths clean.

For example:
```
app/
└── (dashboard)/
    ├── layout.tsx   // Shared layout for all routes in the group
    ├── page.tsx     // Renders at the root URL '/'
    └── settings/
        └── page.tsx // Renders at '/settings'
```

This configuration ensures that the main page is available at `/` and the settings page at `/settings`, while maintaining a streamlined and modular file organization. For further details, refer to the official Next.js documentation on [Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups).
