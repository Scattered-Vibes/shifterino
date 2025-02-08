# Updated Project Structure

This document outlines the latest organization of our project with a focus on clarity, modularity, and efficient grouping. The structure detailed below is designed to support maintainable code and provide intuitive URL paths.

In this updated design, the home page is served at `/` and the settings page at `/settings`, even though both reside within the `(dashboard)` route group. This approach offers several advantages:
- Enhanced Separation of Concerns: Related pages are logically grouped without exposing internal structure in the public URL.
- Optimized Nested Layouts: Shared layouts, metadata, and loading states can be applied seamlessly across grouped pages.
- Clean and Intuitive URLs: Grouping folders are used solely for code organization, keeping URL paths simple.

Key File Structure:
```bash
.                         // Root directory of the project containing all main files and directories
├── README.md             // Project overview, setup, and usage instructions
├── app                   // Next.js application directory utilizing the App Router with internal route groups
│   ├── (auth)            // Authentication module for user login, signup, and related flows
│   │   ├── auth-error     
│   │   │   └── page.tsx  // Renders authentication error messages
│   │   ├── complete-profile  
│   │   │   └── page.tsx  // Prompts users to complete their profile after signing up
│   │   ├── login         
│   │   │   ├── actions.ts     // Server actions for handling login requests
│   │   │   ├── login-form.tsx // UI component for capturing user credentials
│   │   │   └── page.tsx       // Primary login page
│   │   ├── reset-password   
│   │   │   └── page.tsx  // Initiates the password reset process
│   │   ├── signout       
│   │   │   └── actions.ts  // Handles user sign-out actions on the server
│   │   └── signup        
│   │       ├── actions.ts     // Server actions for managing user registration
│   │       ├── check-email    
│   │       │   └── page.tsx  // Verifies user email during the signup process
│   │       ├── page.tsx       // Primary signup page
│   │       └── signup-form.tsx// Registration form component for new users
│   ├── (dashboard)       // Dashboard module for authenticated user features with shared layouts
│   │   ├── employees     
│   │   │   └── page.tsx  // Interface for managing employee data
│   │   ├── layout.tsx    // Shared layout for dashboard pages, applying common design and metadata
│   │   ├── manage        
│   │   │   ├── actions   // Directory for management-specific server actions
│   │   │   │   └── time-off.ts // Processes time-off requests
│   │   │   ├── actions.ts    // General action handlers for management operations
│   │   │   ├── components    // Reusable UI components supporting management functions
│   │   │   │   ├── RealtimeSchedule.tsx // Displays live schedule updates
│   │   │   │   ├── ScheduleManager.tsx  // Interface for overseeing schedule adjustments
│   │   │   │   ├── StaffList.tsx        // Lists team members
│   │   │   │   ├── StaffingOverview.tsx // Provides an overview of staffing levels
│   │   │   │   ├── TimeOffRequestForm.tsx // Form to submit time-off requests
│   │   │   │   └── TimeOffRequests.tsx    // Displays submitted time-off requests
│   │   │   └── page.tsx   // Main management dashboard page
│   │   ├── overview      
│   │   │   └── page.tsx  // Dashboard overview featuring summaries and analytics
│   │   ├── profile       
│   │   │   ├── actions.ts    // Action handlers for profile updates
│   │   │   ├── complete      // Sub-route dedicated to completing profile setup
│   │   │   ├── error.tsx   // Renders error messages related to user profiles
│   │   │   ├── page.tsx    // Main profile page component
│   │   │   └── profile-form.tsx // Form component for editing user profile details
│   │   ├── schedules     
│   │   │   └── page.tsx  // Interface for managing work schedules
│   │   └── time-off      
│   │       └── page.tsx  // Page for managing time-off requests within the dashboard
│   ├── actions           // Global server action handlers for application-wide operations
│   │   └── auth.ts      // Encapsulates global authentication-related actions
│   ├── actions.ts       // Root-level server actions for the entire application
│   ├── api             // API routes for backend integration and operations
│   │   └── auth        
│   │       ├── callback        // Endpoint for processing authentication callbacks
│   │       │   └── route.ts  // Handles authentication callback requests
│   │       ├── cleanup         // Endpoint for executing session cleanup tasks
│   │       │   └── route.ts  // Cleans up user sessions
│   │       ├── force-signout   // Endpoint for enforcing user sign-out via API
│   │       │   └── route.ts  // Processes forced sign-out requests
│   │       ├── session         // API endpoints for session management
│   │       │   └── refresh      // Refreshes user sessions through API
│   │       │       └── route.ts // Server route handling session refresh
│   │       └── signout         // API endpoint for user sign-out
│   │           └── route.ts  // Processes API-based sign-out requests
│   ├── error            // Global error page for displaying application errors
│   │   └── page.tsx     // Renders a comprehensive error message interface
│   ├── favicon.ico      // Application favicon
│   ├── globals.css      // Global CSS styles for the application
│   ├── hooks            // Custom React hooks utilized throughout the app
│   ├── layout.tsx       // Root layout that structures the overall application interface
│   ├── lib              // Library of helper functions and integration utilities
│   │   ├── auth.ts      // Helper functions for authentication mechanisms
│   │   └── supabase     
│   │       ├── client.ts  // Client-side Supabase configuration
│   │       └── server.ts  // Server-side utilities for Supabase integration
│   ├── not-found.tsx    // Custom 404 page component
│   ├── page.tsx         // Main landing page component
│   └── styles           // Application-specific style files
├── components           // Reusable UI components shared across the project
│   ├── ErrorBoundary.tsx  // Catches and displays UI errors
│   ├── auth             
│   │   ├── login-form.tsx  // Presentational component for the login form
│   │   └── signup-form.tsx // Presentational component for the signup form
│   ├── dashboard        
│   │   ├── dashboard-header.tsx  // Header for dashboard pages
│   │   ├── dashboard-shell.tsx   // Layout shell for dashboard pages
│   │   ├── nav.tsx         // Navigation component for dashboard sections
│   │   └── user-nav.tsx    // User-specific dashboard navigation component
│   ├── layout           
│   │   └── client-layout.tsx // Client-side layout component for page structure
│   ├── profile          
│   │   └── profile-form.tsx // Form component for editing user profiles
│   ├── providers        
│   │   └── AuthProvider.tsx // Provides authentication context to the application
│   ├── schedule         
│   │   └── schedule-calendar.tsx // Calendar component for schedule display
│   └── ui               // General-purpose UI components and widgets
│       ├── alert.tsx           // Component for alert notifications
│       ├── avatar.tsx          // Displays user avatars
│       ├── button.tsx          // Custom button component
│       ├── calendar.tsx        // Calendar widget for date selection
│       ├── card.tsx            // Card component for grouping related content
│       ├── dialog.tsx          // Modal dialog for interactive overlays
│       ├── dropdown-menu.tsx   // Dropdown menu component for options listing
│       ├── errors.tsx          // Component for displaying UI or form errors
│       ├── form.tsx            // Generic, uniformly styled form component
│       ├── header.tsx          // Header component for sections
│       ├── input.tsx           // Input field component for forms
│       ├── label.tsx           // Label component paired with form inputs
│       ├── layout-shell.tsx    // Shell layout component for overall page structures
│       ├── loading-spinner.tsx // Spinner component for indicating loading states
│       ├── main-nav.tsx        // Primary navigation component for the UI
│       ├── nav.tsx             // Alternative navigation bar component
│       ├── select.tsx          // Dropdown/select component for forms
│       ├── sheet.tsx           // Sidebar or modal panel component
│       ├── side-nav.tsx        // Side navigation component for additional menus
│       ├── sidebar.tsx         // Layout sidebar navigation component
│       ├── sign-out-button.tsx // Button component for triggering user sign-out
│       ├── skeleton.tsx        // Skeleton loader component for placeholder content
│       ├── skeletons.tsx       // Collection of skeleton loader components
│       ├── table.tsx           // Table component for displaying structured data
│       ├── tabs.tsx            // Tabs component for content segmentation
│       ├── textarea.tsx        // Multi-line text input component for forms
│       ├── toast.tsx           // Toast notification component for alerts
│       ├── toaster.tsx         // Container for managing toast notifications
│       ├── tooltip.tsx         // Tooltip component for providing hover hints
│       ├── use-toast.ts        // Custom hook for managing toast notifications
│       └── user-nav.tsx        // UI component for user-specific navigation actions
├── components.json      // JSON configuration for UI components metadata
├── docs                 // Documentation and technical guides for the project
│   ├── app_flow_document.md              // Document outlining the application's workflow
│   ├── backend_structure_document.md     // Overview of backend architecture
│   ├── file_structure_document.md        // Explanation of project file organization
│   ├── frontend_guidelines_document.md   // Best practices guide for frontend development
│   ├── implementation_plan.md            // Step-by-step implementation plan
│   ├── project_requirements_document.md  // Comprehensive project requirements document
│   ├── project_structure.md              // Current overview of the project's file structure
│   ├── scheduling_logic_document.md      // Documentation on scheduling logic and rules
│   ├── schema_guide.md                    // Guide to the database schema design
│   ├── starter_tech_stack_document.md     // Overview of the initial technology stack
│   ├── supabase-db-overview.md            // Guide to Supabase configuration and usage
│   └── tech_stack_document.md             // Detailed documentation of the overall tech stack
├── eslint.config.mjs    // ESLint configuration file enforcing code quality standards
├── hooks                // Custom React hooks at the project level
│   └── use-toast.ts      // Hook for managing toast notifications
├── jwt_config.sql       // SQL configuration file for JWT authentication settings
├── lib                  // Shared library of helper functions and utilities
│   ├── auth.ts          // Helper functions for authentication processes
│   ├── supabase         // Utilities for integrating with Supabase services
│   │   ├── auth.ts          // Supabase authentication utilities
│   │   ├── client.ts        // Client-side configuration for Supabase
│   │   ├── cookie-adapter.ts // Adapter for managing Supabase cookies
│   │   ├── server.ts        // Server-side utilities for Supabase integration
│   │   └── service.ts       // Service layer for Supabase communication
│   └── utils.ts         // General purpose utility functions
├── middleware.ts       // Middleware for incoming request processing
├── next-env.d.ts       // TypeScript environment definitions for Next.js
├── next.config.js      // Next.js configuration file (JavaScript)
├── next.config.ts      // Next.js configuration file (TypeScript)
├── package-lock.json   // NPM lock file to ensure dependency consistency
├── package.json        // Project manifest with dependencies and scripts
├── postcss.config.js   // PostCSS configuration file (JavaScript)
├── postcss.config.mjs  // PostCSS configuration file (MJS format)
├── public              // Static public assets directory
│   ├── file.svg         // Sample SVG asset
│   ├── globe.svg        // Globe icon in SVG format
│   ├── next.svg         // Next.js logo (SVG)
│   ├── vercel.svg       // Vercel logo (SVG)
│   └── window.svg       // Window graphic in SVG format
├── scripts             // Utility scripts for development tasks
│   └── generate-types.ts // Script for generating TypeScript definitions (e.g., for Supabase)
├── supabase            // Directory for Supabase configuration, migrations, and tests
│   ├── config.toml      // Supabase configuration file
│   ├── migrations       // SQL migration scripts for setting up Supabase
│   │   ├── 001_core_schema_and_auth.sql // Sets up core schema and authentication
│   │   ├── 002_scheduling_schema.sql     // Defines the scheduling schema
│   │   ├── 003_auth_sessions_and_jwt.sql   // Manages auth sessions and JWT handling
│   │   └── 20250214_validate_session.sql   // Validates active user sessions
│   ├── seed.sql         // Seed script for initializing the database
│   └── tests             // Test scripts for verifying Supabase configuration
│       └── database        // Database-specific test scripts
│           ├── 00_setup.test.sql       // Tests initial database setup
│           ├── 01_schema.test.sql      // Verifies the database schema structure
│           ├── 02_rls_policies.test.sql // Validates row-level security (RLS) policies
│           └── 03_business_logic.test.sql // Tests core business logic operations
├── tailwind.config.js   // Tailwind CSS configuration file (JavaScript)
├── tailwind.config.ts   // Tailwind CSS configuration file (TypeScript)
├── tsconfig.json        // TypeScript configuration file for project settings
├── tsconfig.tsbuildinfo // Build information file generated by the TypeScript compiler
└── types                // Custom TypeScript type definitions directory
    └── database.ts    // Database schema type definitions
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
