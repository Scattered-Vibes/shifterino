# Updated Project Structure

This document outlines the latest organization of our project with a focus on clarity, modularity, and efficient grouping. The structure detailed below is designed to support maintainable code and provide intuitive URL paths.

In this updated design, the home page is served at `/` and the settings page at `/settings`, even though both reside within the `(dashboard)` route group. This approach offers several advantages:
- Enhanced Separation of Concerns: Related pages are logically grouped without exposing internal structure in the public URL.
- Optimized Nested Layouts: Shared layouts, metadata, and loading states can be applied seamlessly across grouped pages.
- Clean and Intuitive URLs: Grouping folders are used solely for code organization, keeping URL paths simple.

Key File Structure:
```bash
// Start of Selection
.                         // Project root directory
├── README.md             // Project overview, guide, and setup instructions
├── app                   // Next.js App Router directory with internal route groups
│   ├── (auth)            // Authentication module for login, signup, and related flows
│   │   ├── auth-error     
│   │   │   └── page.tsx  // Renders authentication error messages
│   │   ├── complete-profile  
│   │   │   └── page.tsx  // Prompts users to complete their profile setup
│   │   ├── login         
│   │   │   ├── actions.ts     // Server actions for processing login requests
│   │   │   ├── login-form.tsx // UI component to capture user credentials
│   │   │   └── page.tsx       // Main login page
│   │   ├── reset-password   
│   │   │   └── page.tsx  // Initiates the password reset flow
│   │   ├── signout       
│   │   │   └── actions.ts  // Handles server-side sign-out actions
│   │   └── signup        
│   │       ├── actions.ts     // Manages user registration server actions
│   │       ├── check-email    
│   │       │   └── page.tsx  // Verifies user email during signup
│   │       ├── page.tsx       // Primary signup page
│   │       └── signup-form.tsx// Registration form component for new users
│   ├── (dashboard)       // Dashboard module for authenticated users with shared layouts
│   │   ├── employees     
│   │   │   └── page.tsx  // Interface for managing employee data
│   │   ├── layout.tsx    // Shared layout for dashboard pages (common design and metadata)
│   │   ├── manage        
│   │   │   ├── actions   // Management-specific server actions
│   │   │   │   └── time-off.ts // Processes time-off requests
│   │   │   ├── actions.ts    // General management action handlers
│   │   │   ├── components    // Reusable UI components for management functions
│   │   │   │   ├── RealtimeSchedule.tsx // Displays real-time schedule updates
│   │   │   │   ├── ScheduleManager.tsx  // Manages schedule adjustments
│   │   │   │   ├── StaffList.tsx        // Lists team members
│   │   │   │   ├── StaffingOverview.tsx // Provides an overview of staffing levels
│   │   │   │   ├── TimeOffRequestForm.tsx // Form to submit time-off requests
│   │   │   │   └── TimeOffRequests.tsx    // Displays submitted time-off requests
│   │   │   └── page.tsx   // Main management dashboard interface
│   │   ├── overview      
│   │   │   └── page.tsx  // Dashboard overview with summaries and analytics
│   │   ├── profile       
│   │   │   ├── actions.ts    // Handlers for updating profile details
│   │   │   ├── complete      // Sub-route for completing profile information
│   │   │   ├── error.tsx   // Renders profile-related error messages
│   │   │   ├── page.tsx    // Main profile page component
│   │   │   └── profile-form.tsx // Form component for editing user profiles
│   │   ├── schedules     
│   │   │   └── page.tsx  // Interface for managing work schedules
│   │   └── time-off      
│   │       └── page.tsx  // Page for managing time-off requests within the dashboard
│   ├── actions           // Global server actions for application-wide operations
│   │   └── auth.ts      // Encapsulates global authentication actions
│   ├── actions.ts       // Root-level server actions for the entire application
│   ├── api             // API routes for backend integrations and operations
│   │   └── auth        
│   │       ├── callback        // Processes authentication callback requests
│   │       │   └── route.ts  // API route for auth callbacks
│   │       ├── cleanup         // Executes session cleanup tasks
│   │       │   └── route.ts  // API route for session cleanup
│   │       ├── force-signout   // Enforces user sign-out via API
│   │       │   └── route.ts  // API route for forced sign-out
│   │       ├── session         // Endpoints for session management
│   │       │   └── refresh      // Refreshes user sessions through the API
│   │       │       └── route.ts // API route for session refresh
│   │       └── signout         // API endpoint for processing user sign-out
│   │           └── route.ts  // Handles API-driven sign-out requests
│   ├── error            // Global error page for handling application errors
│   │   └── page.tsx     // Renders a comprehensive error interface
│   ├── favicon.ico      // Application favicon
│   ├── globals.css      // Global CSS styles
│   ├── hooks            // Custom React hooks available across the app
│   ├── layout.tsx       // Root layout for overall application structure
│   ├── lib              // Helper functions and integration utilities
│   │   ├── auth.ts      // Utilities for managing authentication
│   │   └── supabase     
│   │       ├── client.ts  // Client-side Supabase configuration
│   │       └── server.ts  // Server-side Supabase utilities
│   ├── not-found.tsx    // Custom 404 page component
│   ├── page.tsx         // Main landing page component
│   └── styles           // Application-specific style files
├── components           // Reusable UI components shared across the project
│   ├── ErrorBoundary.tsx  // Captures and displays UI errors
│   ├── auth             
│   │   ├── login-form.tsx  // Presentation component for the login form
│   │   └── signup-form.tsx // Presentation component for the signup form
│   ├── dashboard        
│   │   ├── dashboard-header.tsx  // Header component for dashboard pages
│   │   ├── dashboard-shell.tsx   // Layout shell for dashboard sections
│   │   ├── nav.tsx         // Navigation component for dashboard sections
│   │   └── user-nav.tsx    // User-specific navigation within the dashboard
│   ├── layout           
│   │   └── client-layout.tsx // Client-side layout component for structuring pages
│   ├── profile          
│   │   └── profile-form.tsx // Form component for editing user profiles
│   ├── providers        
│   │   └── AuthProvider.tsx // Provides authentication context to the application
│   ├── schedule         
│   │   └── schedule-calendar.tsx // Calendar component for visualizing schedules
│   └── ui               // General-purpose UI components and widgets
│       ├── alert.tsx           // Component for alert notifications
│       ├── avatar.tsx          // Displays user avatars
│       ├── button.tsx          // Custom button component
│       ├── calendar.tsx        // Calendar widget for date selection
│       ├── card.tsx            // Card component for grouping related content
│       ├── dialog.tsx          // Modal dialog for interactive overlays
│       ├── dropdown-menu.tsx   // Dropdown menu for listing options
│       ├── errors.tsx          // Displays UI or form errors
│       ├── form.tsx            // Uniformly styled form component
│       ├── header.tsx          // Header component for page sections
│       ├── input.tsx           // Input field component for forms
│       ├── label.tsx           // Label component for form inputs
│       ├── layout-shell.tsx    // Shell layout component for overall page structures
│       ├── loading-spinner.tsx // Spinner component indicating loading states
│       ├── main-nav.tsx        // Primary navigation component for the UI
│       ├── nav.tsx             // Alternative navigation bar component
│       ├── select.tsx          // Dropdown/select component for forms
│       ├── sheet.tsx           // Sidebar or modal panel component
│       ├── side-nav.tsx        // Additional side navigation component
│       ├── sidebar.tsx         // Layout sidebar navigation component
│       ├── sign-out-button.tsx // Button for triggering user sign-out
│       ├── skeleton.tsx        // Skeleton loader for content placeholders
│       ├── skeletons.tsx       // Collection of skeleton loader components
│       ├── table.tsx           // Component for displaying structured data in tables
│       ├── tabs.tsx            // Tabs component for content segmentation
│       ├── textarea.tsx        // Multi-line text input component for forms
│       ├── toast.tsx           // Toast notification component for alerts
│       ├── toaster.tsx         // Container for managing toast notifications
│       ├── tooltip.tsx         // Tooltip component providing hover hints
│       ├── use-toast.ts        // Custom hook for managing toast notifications
│       └── user-nav.tsx        // Navigation component for user-specific actions
├── components.json      // JSON configuration for UI components metadata
├── docs                 // Documentation and technical guides for the project
│   ├── app_flow_document.md              // Outlines the application's workflow
│   ├── backend_structure_document.md     // Overview of backend architecture
│   ├── file_structure_document.md        // Explains the project file organization
│   ├── frontend_guidelines_document.md   // Best practices for frontend development
│   ├── implementation_plan.md            // Step-by-step implementation plan
│   ├── project_requirements_document.md  // Comprehensive project requirements document
│   ├── project_structure.md              // Detailed overview of the project structure
│   ├── scheduling_logic_document.md      // Documentation on scheduling logic and rules
│   ├── schema_guide.md                    // Guide to the database schema design
│   ├── starter_tech_stack_document.md     // Overview of the initial technology stack
│   ├── supabase-db-overview.md            // Guide to Supabase configuration and usage
│   └── tech_stack_document.md             // Detailed documentation of the overall tech stack
├── eslint.config.mjs    // ESLint configuration for enforcing code quality standards
├── hooks                // Global custom React hooks
│   └── use-toast.ts      // Hook for managing toast notifications
├── jwt_config.sql       // SQL configuration for JWT authentication settings
├── lib                  // Shared libraries and helper utilities
│   ├── auth.ts          // Helper functions for authentication processes
│   ├── supabase         // Utilities for integrating Supabase services
│   │   ├── auth.ts          // Supabase-specific authentication utilities
│   │   ├── client.ts        // Client-side Supabase configuration
│   │   ├── cookie-adapter.ts // Adapter for managing Supabase cookies
│   │   ├── server.ts        // Server-side Supabase utilities
│   │   └── service.ts       // Service layer for Supabase communication
│   └── utils.ts         // General-purpose utility functions
├── middleware.ts       // Middleware for processing incoming requests
├── next-env.d.ts       // TypeScript environment definitions for Next.js
├── next.config.js      // Next.js configuration file (JavaScript)
├── next.config.ts      // Next.js configuration file (TypeScript)
├── package-lock.json   // NPM lock file ensuring dependency consistency
├── package.json        // Project manifest defining dependencies and scripts
├── postcss.config.js   // PostCSS configuration file (JavaScript)
├── postcss.config.mjs  // PostCSS configuration file (MJS)
├── public              // Directory for static public assets
│   ├── file.svg         // Sample SVG asset
│   ├── globe.svg        // Globe icon in SVG format
│   ├── next.svg         // Next.js logo (SVG)
│   ├── vercel.svg       // Vercel logo (SVG)
│   └── window.svg       // Window graphic in SVG format
├── scripts             // Utility scripts for development tasks
│   └── generate-types.ts // Script for generating TypeScript definitions (e.g., for Supabase)
├── supabase            // Supabase configuration, migrations, and tests
│   ├── config.toml      // Supabase configuration file
│   ├── migrations       // SQL migration scripts for setting up Supabase
│   │   ├── 001_core_schema_and_auth.sql // Sets up core schema and authentication
│   │   ├── 002_scheduling_schema.sql     // Defines the scheduling schema
│   │   ├── 003_auth_sessions_and_jwt.sql   // Manages authentication sessions and JWT handling
│   │   └── 20250214_validate_session.sql   // Validates active user sessions
│   ├── seed.sql         // Seed script for initializing the database
│   └── tests             // Test scripts for verifying Supabase configuration
│       └── database        // Database-specific test scripts
│           ├── 00_setup.test.sql       // Tests initial database setup
│           ├── 01_schema.test.sql      // Verifies the database schema structure
│           ├── 02_rls_policies.test.sql // Validates row-level security policies
│           └── 03_business_logic.test.sql // Tests core business logic operations
├── tailwind.config.js   // Tailwind CSS configuration file (JavaScript)
├── tailwind.config.ts   // Tailwind CSS configuration file (TypeScript)
├── tsconfig.json        // TypeScript configuration for project settings
├── tsconfig.tsbuildinfo // Build information generated by the TypeScript compiler
└── types                // Custom TypeScript type definitions
    └── database.ts    // Database schema type definitions
// End of Selectio
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
