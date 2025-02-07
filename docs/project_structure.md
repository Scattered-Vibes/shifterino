# Updated Project Structure

This document outlines the latest organization of our project with a focus on clarity, modularity, and efficient grouping. The structure detailed below is designed to support maintainable code and provide intuitive URL paths.

In this updated design, the home page is served at `/` and the settings page at `/settings`, even though both reside within the `(dashboard)` route group. This approach offers several advantages:
- Enhanced Separation of Concerns: Related pages are logically grouped without exposing internal structure in the public URL.
- Optimized Nested Layouts: Shared layouts, metadata, and loading states can be applied seamlessly across grouped pages.
- Clean and Intuitive URLs: Grouping folders are used solely for code organization, keeping URL paths simple.

Key File Structure:
```bash
.                         // Project root directory
├── README.md             // Documentation and usage instructions
├── app                   // Next.js 14 application leveraging the App Router with Route Groups
│   ├── (auth)            // Authentication module (internal grouping for auth-related pages)
│   │   ├── auth-error     
│   │   │   └── page.tsx  // Error page for authentication issues
│   │   ├── complete-profile  
│   │   │   └── page.tsx  // Page for completing the user profile after signup
│   │   ├── login         
│   │   │   ├── actions.ts     // Server actions for processing login requests
│   │   │   ├── login-form.tsx // Component for capturing user login credentials
│   │   │   └── page.tsx       // Main login page component
│   │   ├── reset-password   
│   │   │   └── page.tsx  // Interface for initiating a password reset
│   │   ├── signout       
│   │   │   └── actions.ts  // Server action for signing out users
│   │   └── signup        
│   │       ├── actions.ts     // Server actions handling user registration
│   │       ├── check-email    
│   │       │   └── page.tsx  // Email verification interface during signup
│   │       ├── page.tsx       // Main signup page component
│   │       └── signup-form.tsx// Registration form component
│   ├── (dashboard)       // Dashboard module for authenticated user features (internal grouping)
│   │   ├── employees     
│   │   │   └── page.tsx  // Employee management interface
│   │   ├── layout.tsx    // Shared layout for all dashboard pages
│   │   ├── manage        
│   │   │   ├── actions   // Directory for management-specific server actions
│   │   │   │   └── time-off.ts // Processes time-off requests
│   │   │   ├── actions.ts    // General action handlers for management tasks
│   │   │   ├── components    // Reusable UI components for management functionalities
│   │   │   │   ├── RealtimeSchedule.tsx // Component displaying real-time scheduling updates
│   │   │   │   ├── ScheduleManager.tsx  // Interface for managing schedules
│   │   │   │   ├── StaffList.tsx        // Component listing staff members
│   │   │   │   ├── StaffingOverview.tsx // Component providing an overview of staffing levels
│   │   │   │   ├── TimeOffRequestForm.tsx // Form for submitting time-off requests
│   │   │   │   └── TimeOffRequests.tsx    // Displays submitted time-off requests
│   │   │   └── page.tsx   // Main management dashboard page
│   │   ├── overview      
│   │   │   └── page.tsx  // Overview page with summaries and analytics for the dashboard
│   │   ├── profile       
│   │   │   ├── actions.ts    // Actions for updating user profile details
│   │   │   ├── complete      // Sub-route for completing profile setup
│   │   │   ├── error.tsx   // Error handling for profile-related issues
│   │   │   ├── page.tsx    // Main profile page component
│   │   │   └── profile-form.tsx // Form component for editing the user profile
│   │   ├── schedules     
│   │   │   └── page.tsx  // Interface for managing work schedules
│   │   └── time-off      
│   │       └── page.tsx  // Interface for handling time-off requests within the dashboard
│   ├── actions           // Global action handlers for application-level functionalities
│   │   └── auth.ts      // Global actions related to authentication
│   ├── actions.ts       // Root-level action definitions for the Next.js application
│   ├── api             // API routes for server-side operations
│   │   └── auth        
│   │       ├── callback        // Endpoint for authentication callback processing
│   │       │   └── route.ts  // Handles authentication callback requests
│   │       ├── cleanup         // Endpoint for session cleanup operations
│   │       │   └── route.ts  // API route for cleaning up user sessions
│   │       ├── force-signout   // Endpoint to enforce user sign-out
│   │       │   └── route.ts  // API route handling forced sign-out requests
│   │       ├── session         // Endpoints for session management
│   │       │   └── refresh      // Refresh endpoint for user sessions
│   │       │       └── route.ts // API route to refresh user sessions
│   │       └── signout         // API endpoint for user sign-out
│   │           └── route.ts  // Processes sign-out requests via the API
│   ├── error            // Global error page for the application
│   │   └── page.tsx     // Component displaying application error messages
│   ├── favicon.ico      // Application favicon icon
│   ├── globals.css      // Global CSS styles for the application
│   ├── hooks            // Custom React hooks used across the application
│   ├── layout.tsx       // Root layout component defining the overall app structure
│   ├── lib              // Helper functions and integration libraries
│   │   ├── auth.ts      // Utility functions for authentication
│   │   └── supabase     
│   │       ├── client.ts  // Client-side configuration for Supabase integration
│   │       └── server.ts  // Server-side utilities for Supabase integration
│   ├── not-found.tsx    // Custom 404 Not Found page component
│   ├── page.tsx         // Main landing page component
│   └── styles           // Additional style files specific to the app
├── components           // Reusable UI components shared across the project
│   ├── ErrorBoundary.tsx  // Component for catching and displaying UI errors
│   ├── auth             
│   │   ├── login-form.tsx  // Presentational login form component
│   │   └── signup-form.tsx // Presentational signup form component
│   ├── dashboard        
│   │   ├── dashboard-header.tsx  // Header component for the dashboard
│   │   ├── dashboard-shell.tsx   // Dashboard layout shell component
│   │   ├── nav.tsx         // Navigation component for dashboard sections
│   │   └── user-nav.tsx    // User-specific navigation within the dashboard
│   ├── layout           
│   │   └── client-layout.tsx // Client-side layout component
│   ├── profile          
│   │   └── profile-form.tsx // Profile editing form component
│   ├── providers        
│   │   └── AuthProvider.tsx // Provider component managing authentication state
│   ├── schedule         
│   │   └── schedule-calendar.tsx // Calendar component for displaying schedules
│   └── ui               // General-purpose UI components and widgets
│       ├── alert.tsx           // Alert component for notifications
│       ├── avatar.tsx          // Component displaying user avatars
│       ├── button.tsx          // Custom button component
│       ├── calendar.tsx        // Calendar widget for date selection
│       ├── card.tsx            // Card component for grouping content
│       ├── dialog.tsx          // Modal dialog component for interactive overlays
│       ├── dropdown-menu.tsx   // Dropdown menu component for option lists
│       ├── errors.tsx          // Component for displaying UI or form errors
│       ├── form.tsx            // Generic form component with uniform styling
│       ├── header.tsx          // Component for section headers
│       ├── input.tsx           // Input field component for forms
│       ├── label.tsx           // Label component for input fields
│       ├── layout-shell.tsx    // Shell layout component for overall page structure
│       ├── loading-spinner.tsx // Spinner component indicating loading states
│       ├── main-nav.tsx        // Primary navigation component for the UI
│       ├── nav.tsx             // Alternative navigation bar component
│       ├── select.tsx          // Dropdown/select component for form inputs
│       ├── sheet.tsx           // Sidebar or modal panel component
│       ├── side-nav.tsx        // Side navigation component for additional menus
│       ├── sidebar.tsx         // Component for layout sidebar navigation
│       ├── sign-out-button.tsx // Button component to trigger user sign-out
│       ├── skeleton.tsx        // Skeleton loader component for placeholder content
│       ├── skeletons.tsx       // Collection of skeleton loader components
│       ├── table.tsx           // Table component for structured data display
│       ├── tabs.tsx            // Tabs component for content segmentation
│       ├── textarea.tsx        // Multi-line text input component
│       ├── toast.tsx           // Toast notification component
│       ├── toaster.tsx         // Container for managing toast notifications
│       ├── tooltip.tsx         // Tooltip component providing hover hints
│       ├── use-toast.ts        // Custom hook for managing toast notifications
│       └── user-nav.tsx        // UI component for user-specific navigation actions
├── components.json      // JSON metadata and configuration for UI components
├── docs                 // Project documentation and technical guides
│   ├── app_flow_document.md              // Document outlining the application flow
│   ├── backend_structure_document.md     // Overview of the backend architecture
│   ├── file_structure_document.md        // Explanation of the project’s file organization
│   ├── frontend_guidelines_document.md   // Best practices for frontend development
│   ├── implementation_plan.md            // Step-by-step implementation plan
│   ├── project_requirements_document.md  // Detailed project requirements
│   ├── project_structure.md              // Updated overview of the project structure
│   ├── scheduling_logic_document.md      // Documentation of scheduling logic and rules
│   ├── schema_guide.md                    // Guide to the database schema design
│   ├── starter_tech_stack_document.md     // Overview of the initial technology stack used
│   ├── supabase-db-overview.md            // Overview of Supabase configuration and usage
│   └── tech_stack_document.md             // Detailed documentation of the overall tech stack
├── eslint.config.mjs    // ESLint configuration for enforcing code quality rules
├── hooks                // Project-level custom React hooks
│   └── use-toast.ts      // Custom hook for managing toast notifications
├── jwt_config.sql       // SQL configuration file for JWT authentication settings
├── lib                  // Shared library of helper functions and utilities
│   ├── auth.ts          // Helper functions for authentication
│   ├── supabase         // Utilities for integrating with Supabase services
│   │   ├── auth.ts          // Supabase authentication utility functions
│   │   ├── client.ts        // Client-side configuration for Supabase
│   │   ├── cookie-adapter.ts // Adapter for managing cookies in Supabase interactions
│   │   ├── server.ts        // Server-side Supabase integration utilities
│   │   └── service.ts       // Service layer for communication with Supabase
│   └── utils.ts         // General utility functions and helpers
├── middleware.ts       // Middleware for processing incoming requests
├── next-env.d.ts       // TypeScript environment definitions for Next.js
├── next.config.js      // Next.js configuration file (JavaScript)
├── next.config.ts      // Next.js configuration file (TypeScript)
├── package-lock.json   // NPM dependency lock file
├── package.json        // Project manifest with dependencies and scripts
├── postcss.config.js   // PostCSS configuration file (JavaScript)
├── postcss.config.mjs  // PostCSS configuration file (MJS format)
├── public              // Directory for static public assets
│   ├── file.svg         // Example SVG asset
│   ├── globe.svg        // Globe icon in SVG format
│   ├── next.svg         // Next.js logo (SVG)
│   ├── vercel.svg       // Vercel logo (SVG)
│   └── window.svg       // SVG graphic representing a window
├── scripts             // Utility scripts for development tasks
│   └── generate-types.ts // Script to generate TypeScript definitions (e.g., for Supabase)
├── supabase            // Supabase configuration, migrations, and tests
│   ├── config.toml      // Supabase configuration file
│   ├── migrations       // SQL migration scripts for setting up Supabase
│   │   ├── 001_core_schema_and_auth.sql // Core schema and authentication setup
│   │   ├── 002_scheduling_schema.sql     // SQL script defining the scheduling schema
│   │   ├── 003_auth_sessions_and_jwt.sql   // SQL for managing auth sessions and JWT handling
│   │   └── 20250214_validate_session.sql   // SQL script for validating user sessions
│   ├── seed.sql         // Seed script for initializing the database with data
│   └── tests             // Test scripts for validating Supabase configurations
│       └── database        // Database-specific test scripts
│           ├── 00_setup.test.sql       // Test for initial database setup
│           ├── 01_schema.test.sql      // Verifies the database schema structure
│           ├── 02_rls_policies.test.sql // Validates row-level security policies
│           └── 03_business_logic.test.sql // Tests for business logic operations
├── tailwind.config.js   // Tailwind CSS configuration file (JavaScript)
├── tailwind.config.ts   // Tailwind CSS configuration file (TypeScript)
├── tsconfig.json        // TypeScript configuration file for the project
├── tsconfig.tsbuildinfo // Build info file generated by the TypeScript compiler
└── types                // Custom TypeScript type definitions
    └── database.ts    // Type definitions for the database schema
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
