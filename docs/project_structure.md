. // Root: Entire project structure including documentation, code, tests, and configurations
├── README.md // Project overview and documentation
├── __tests__ // Automated test files
│   └── components // Component-specific tests
│       └── StaffingOverview.test.tsx // Unit test for StaffingOverview component
├── app // Main application code (Next.js pages, routes, API endpoints, and layouts)
│   ├── (auth) // Authentication features (login, signup, password management, etc.)
│   │   ├── actions.ts // Authentication action handlers
│   │   ├── auth-error // Auth error display module
│   │   │   └── page.tsx // Auth error page component
│   │   ├── callback // External auth callback handler
│   │   │   └── route.ts // Auth callback API route
│   │   ├── complete-profile // Post-signup complete profile flow
│   │   │   └── page.tsx // Complete profile page component
│   │   ├── login // Login feature components and pages
│   │   │   ├── login-form.test.tsx // Login form tests
│   │   │   ├── login-form.tsx // Login form component
│   │   │   └── page.tsx // Login page component
│   │   ├── reset-password // Password reset functionality
│   │   │   ├── page.tsx // Password reset page component
│   │   │   └── reset-password-form.tsx // Password reset form component
│   │   ├── signup // User signup processes
│   │   │   ├── actions.ts // Signup actions and logic
│   │   │   ├── check-email // Email verification step
│   │   │   │   └── page.tsx // Email verification feedback page
│   │   │   ├── page.tsx // Signup main page
│   │   │   └── signup-form.tsx // Signup form component
│   │   └── update-password // Password update for authenticated users
│   │       ├── page.tsx // Update password page component
│   │       └── update-password-form.tsx // Password update form component
│   ├── (dashboard) // Dashboard area with management tools for logged-in users
│   │   ├── employees // Employee management views
│   │   │   └── page.tsx // Employee details page
│   │   ├── layout.tsx // Dashboard layout component
│   │   ├── loading.tsx // Dashboard loading indicator
│   │   ├── manage // Scheduling and time-off management section
│   │   │   ├── actions // Action files for management processes
│   │   │   │   ├── scheduling.ts // Scheduling actions
│   │   │   │   └── time-off.ts // Time-off request actions
│   │   │   ├── actions.ts // General management actions
│   │   │   ├── components // Reusable management UI components
│   │   │   │   ├── RealtimeSchedule.tsx // Live schedule updater
│   │   │   │   ├── ScheduleManager.tsx // Schedule management interface
│   │   │   │   ├── StaffList.tsx // Staff listing component
│   │   │   │   ├── TimeOffRequestForm.tsx // Time-off request form
│   │   │   │   └── TimeOffRequests.tsx // Submitted time-off requests overview
│   │   │   ├── layout.tsx // Management section layout
│   │   │   ├── metadata.ts // Management metadata configuration
│   │   │   ├── overtime // Overtime management subsection
│   │   │   │   ├── data-table.tsx // Overtime records data table
│   │   │   │   ├── loading.tsx // Overtime section loading indicator
│   │   │   │   └── page.tsx // Overtime management main page
│   │   │   ├── page.tsx // Main management page
│   │   │   └── swaps // Shift swap management section
│   │   │       ├── calendar-view.tsx // Calendar view for shift swaps
│   │   │       ├── data-table.tsx // Shift swaps data table
│   │   │       ├── loading.tsx // Shift swaps loading indicator
│   │   │       └── page.tsx // Shift swap management main page
│   │   ├── overview // Dashboard overview summary
│   │   │   └── page.tsx // Overview page component
│   │   ├── profile // User profile management
│   │   │   ├── actions.ts // Profile update actions
│   │   │   ├── error.tsx // Profile error display
│   │   │   ├── loading.tsx // Profile page loading indicator
│   │   │   ├── page.tsx // Profile main page
│   │   │   ├── password-form.tsx // Profile password update form
│   │   │   └── profile-form.tsx // Profile detail editing form
│   │   ├── requirements // Staffing requirements management
│   │   │   ├── _components // Private components for staffing requirements
│   │   │   │   └── staffing-requirements-form.tsx // Staffing requirements entry form
│   │   │   ├── actions.ts // Staffing requirements actions
│   │   │   ├── create-button.tsx // Button to create new requirement
│   │   │   ├── data-table.tsx // Staffing requirements data table
│   │   │   ├── delete-dialog.tsx // Requirement deletion confirmation dialog
│   │   │   ├── edit-dialog.tsx // Requirement editing dialog
│   │   │   ├── error.tsx // Staffing requirements error display
│   │   │   ├── layout.tsx // Requirements section layout
│   │   │   ├── loading.tsx // Requirements page loading indicator
│   │   │   ├── not-found.tsx // 404 page for missing requirement
│   │   │   └── page.tsx // Main staffing requirements page
│   │   ├── schedules // Scheduling feature pages and components
│   │   │   ├── calendar-view.tsx // Schedule calendar view
│   │   │   ├── create-button.tsx // Button to create schedule
│   │   │   ├── error.tsx // Scheduling error display
│   │   │   ├── filters.tsx // Schedule filter component
│   │   │   ├── list-view.tsx // Schedule list view
│   │   │   ├── loading.tsx // Schedule page loading indicator
│   │   │   ├── page.tsx // Main schedules page
│   │   │   └── view-options.tsx // Schedule view options
│   │   ├── settings // Dashboard settings
│   │   │   ├── error.tsx // Settings error display
│   │   │   ├── loading.tsx // Settings loading indicator
│   │   │   └── page.tsx // Main settings page
│   │   ├── shift-options // Shift configuration options management
│   │   │   ├── create-button.tsx // Button to create a shift option
│   │   │   ├── data-table.tsx // Shift options data table
│   │   │   ├── delete-dialog.tsx // Shift option deletion dialog
│   │   │   ├── edit-dialog.tsx // Shift option editing dialog
│   │   │   ├── error.tsx // Shift options error display
│   │   │   ├── loading.tsx // Shift options loading indicator
│   │   │   └── page.tsx // Shift options management page
│   │   └── time-off // Time-off request management section
│   │       ├── components // Time-off specific UI components
│   │       │   └── time-off-requests-wrapper.tsx // Time-off requests UI wrapper
│   │       ├── create-button.tsx // Button to initiate a time-off request
│   │       ├── data-table.tsx // Time-off requests data table
│   │       ├── filters.tsx // Time-off request filter
│   │       ├── loading.tsx // Time-off section loading indicator
│   │       └── page.tsx // Main time-off requests page
│   ├── api // Serverless API endpoints
│   │   ├── admin // Administrative API endpoints
│   │   │   ├── middleware.ts // Admin API middleware for auth and authorization
│   │   │   ├── route.ts // Main admin API route
│   │   │   └── users // Admin API endpoints for user management
│   │   │       ├── [id] // Dynamic route for specific user operations
│   │   │       │   └── route.ts // API handler for a user by ID
│   │   │       └── route.ts // General admin user API route
│   │   └── auth // Authentication API endpoints
│   │       ├── callback // Auth callback endpoint
│   │       │   └── route.ts // Auth callback API handler
│   │       ├── cleanup // Cleanup endpoint for obsolete auth sessions
│   │       │   └── route.ts // Auth session cleanup handler
│   │       ├── force-signout // Force sign-out endpoint
│   │       │   └── route.ts // Force sign-out API handler
│   │       ├── login // Login API endpoint
│   │       │   └── route.ts // Login API route handler
│   │       ├── session // Session management endpoints
│   │       │   └── refresh // Session refresh endpoint
│   │       │       └── route.ts // Session refresh API handler
│   │       └── signout // Signout API endpoint
│   │           └── route.ts // Signout API route handler
│   ├── error // Custom error page components
│   │   └── page.tsx // Custom error page
│   ├── error.tsx // Global error rendering component
│   ├── favicon.ico // Application favicon
│   ├── global-error.tsx // Global error boundary
│   ├── globals.css // Global CSS styles
│   ├── hooks // App-specific custom React hooks
│   │   ├── use-employee-schedule.ts // Manages employee schedule data
│   │   └── useRealtimeSubscription.ts // Real-time subscription hook
│   ├── layout.tsx // Root layout component for app pages
│   ├── loading.tsx // Global page transition loading component
│   ├── not-found.tsx // 404 not found page
│   ├── page.tsx // Primary entry point page
│   ├── providers // App context and state management providers
│   │   └── supabase-provider.tsx // Supabase context provider
│   └── schedule // Scheduling features and UI components
│       ├── _components // Private scheduling management components
│       │   ├── schedule-manager.tsx // Component for schedule creation/editing
│       │   ├── shift-calendar.tsx // Shift visualization calendar
│       │   ├── shift-update-form.tsx // Shift update form
│       │   └── staffing-requirements.tsx // Displays staffing requirements in schedules
│       ├── page.tsx // Main scheduling page
│       └── shift-swaps // Shift swap functionality
│           └── page.tsx // Shift swap management page
├── components // Reusable UI components
│   ├── StaffingOverview.tsx // Staffing overview display component
│   ├── auth // Authentication UI components
│   │   └── sign-out-button.tsx // Sign-out button component
│   ├── calendar // Calendar view components
│   │   └── ShiftCalendar.tsx // Shift calendar component
│   ├── dashboard // Dashboard-specific UI elements
│   ├── employees // Employee management UI components
│   │   ├── create-button.tsx // New employee creation button
│   │   ├── data-table.tsx // Employee data table
│   │   ├── delete-dialog.tsx // Employee deletion confirmation dialog
│   │   ├── edit-dialog.tsx // Employee edit dialog
│   │   └── loading.tsx // Employee section loading indicator
│   ├── error-boundary.tsx // UI error boundary component
│   ├── forms // Reusable form components
│   │   ├── ScheduleForm.tsx // Schedule creation/editing form
│   │   ├── ShiftUpdateForm.tsx // Shift information update form
│   │   └── TimeOffRequestForm.tsx // Time-off request submission form
│   ├── layout // Client-side layout components
│   │   └── client-layout.tsx // Client page layout component
│   ├── profile // User profile UI components
│   │   └── profile-form.tsx // User profile editing form
│   ├── providers // Global React context providers
│   │   ├── AuthProvider.tsx // Authentication context provider
│   │   ├── root-provider.tsx // Root provider for app-wide state
│   │   ├── supabase-provider.tsx // Supabase client provider (duplicate)
│   │   ├── theme-provider.tsx // Theming provider component
│   │   └── tooltip-provider.tsx // Tooltip provider component
│   ├── schedule // Scheduling UI components
│   │   └── schedule-calendar.tsx // Schedule calendar view component
│   ├── theme-provider.tsx // Standalone theming provider
│   └── ui // Basic UI building blocks
│       ├── alert-dialog.tsx // Alert dialog component
│       ├── alert.tsx // Alert notification component
│       ├── avatar.tsx // User avatar component
│       ├── badge.tsx // Badge component
│       ├── button.tsx // Reusable button component
│       ├── calendar.tsx // Basic calendar UI component
│       ├── card.tsx // Card component
│       ├── checkbox.tsx // Checkbox component
│       ├── dialog.tsx // Generic dialog component
│       ├── dropdown-menu.tsx // Dropdown menu component
│       ├── error-boundary.tsx // UI error boundary
│       ├── errors.tsx // UI error message display
│       ├── form.tsx // Generic form wrapper
│       ├── header.tsx // Header component
│       ├── input.tsx // Text input component
│       ├── label.tsx // Form label component
│       ├── loading-spinner.tsx // Loading spinner component
│       ├── loading.tsx // Simple loading indicator
│       ├── main-nav.tsx // Main navigation bar
│       ├── popover.tsx // Popover component
│       ├── progress.tsx // Progress bar component
│       ├── radio-group.tsx // Radio group component
│       ├── scroll-area.tsx // Scrollable container
│       ├── select.tsx // Select dropdown component
│       ├── separator.tsx // Separator component
│       ├── sheet.tsx // Slide-over sheet component
│       ├── sidebar-nav.tsx // Sidebar navigation
│       ├── sign-out-button.tsx // Sign-out button component (duplicate)
│       ├── skeleton.tsx // Skeleton loader component
│       ├── sonner.tsx // Sonner notifications component
│       ├── switch.tsx // Toggle switch component
│       ├── table.tsx // Data presentation table component
│       ├── tabs.tsx // Tabs navigation component
│       ├── textarea.tsx // Text area component
│       ├── theme-toggle.tsx // Theme toggle component
│       ├── toast.tsx // Toast notification component
│       ├── toaster.tsx // Toast notifications container
│       ├── tooltip.tsx // Tooltip component
│       ├── use-toast.ts // Custom hook for triggering toasts
│       └── user-nav.tsx // User navigation component
├── components.json // Components configuration (tooling/documentation)
├── docs // Project documentation files
│   ├── SECURITY.md // Security guidelines
│   ├── project_requirements_document.md // Project requirements document
│   ├── rls_policies.md // Row-level security policies documentation
│   ├── scheduling_logic_document.md // Scheduling algorithms and logic overview
│   └── supabase-db-overview.md // Supabase database overview
├── eslint.config.mjs // ESLint configuration (MJS)
├── hooks // Global custom hooks (outside app)
│   ├── use-auth.ts // Authentication logic hook
│   ├── use-employee-schedule.ts // Employee schedule management hook (duplicate)
│   ├── use-media-query.ts // Responsive design media query hook
│   └── use-toast.ts // Toast notifications hook (duplicate)
├── jwt_config.sql // JWT configuration SQL script
├── lib // Helper utilities and internal APIs
│   ├── api-utils.ts // API utility functions
│   ├── auth // Authentication library
│   │   ├── client.ts // Client auth utilities
│   │   ├── middleware.ts // API auth middleware
│   │   └── server.ts // Server auth helper functions
│   ├── auth.ts // General auth utilities
│   ├── config.server.ts // Server configuration settings
│   ├── config.ts // Project configuration
│   ├── env.public.ts // Public environment variables
│   ├── env.server.ts // Server environment variables
│   ├── env.ts // Combined environment configuration
│   ├── hooks // Shared library hooks
│   │   ├── index.ts // Shared hooks exports
│   │   ├── use-auth-mutations.ts // Auth mutations hook
│   │   ├── use-auth.ts // Authentication state hook
│   │   ├── use-employees.ts // Employee data management hook
│   │   ├── use-query.ts // Data query hook
│   │   ├── use-schedule-mutations.ts // Schedule mutations hook
│   │   ├── use-schedules.ts // Schedule management hook
│   │   ├── use-shift-swaps.ts // Shift swaps management hook
│   │   ├── use-shifts.ts // Shift data hook
│   │   ├── use-staffing-requirements.ts // Staffing requirements hook
│   │   └── use-time-off.ts // Time-off request hook
│   ├── providers // Library state management providers
│   │   └── query-provider.tsx // API query caching provider
│   ├── rate-limit.ts // API rate limiting logic
│   ├── schedule.ts // Scheduling utility functions
│   ├── scheduling // Scheduling helper functions
│   │   ├── conflicts.ts // Detects scheduling conflicts
│   │   ├── generate.ts // Generates schedule structures
│   │   ├── helpers.ts // Misc scheduling helpers
│   │   ├── scoring.ts // Shift assignment scoring algorithms
│   │   └── tracking.ts // Tracks scheduling changes
│   ├── supabase // Supabase integration utilities
│   │   ├── auth.ts // Supabase auth utilities
│   │   ├── client.ts // Supabase client initialization
│   │   ├── cookie-adapter.ts // Cookie adapter for Supabase
│   │   ├── data-access // Supabase data access layer
│   │   │   ├── employees.ts // Employee records data functions
│   │   │   ├── schedules.ts // Schedule data access functions
│   │   │   ├── shifts.ts // Shift data access functions
│   │   │   └── time-off.ts // Time-off data management functions
│   │   ├── data-access.ts // Aggregate Supabase data utilities
│   │   ├── realtime.ts // Supabase real-time subscription setup
│   │   ├── server.ts // Supabase server utilities
│   │   └── service.ts // Supabase API service layer
│   ├── supabase-mock.ts // Supabase mock for testing
│   ├── utils // General utility functions
│   │   ├── error-handler.ts // Centralized error handling
│   │   └── query.ts // API query helper
│   ├── utils.ts // Miscellaneous utilities
│   └── validations // Data validation utilities
│       ├── schemas.ts // Data validation schemas
│       └── shift.ts // Shift data validation rules
├── middleware // Custom API middleware implementations
│   └── rate-limit.ts // API rate limiting middleware
├── middleware.ts // Global application middleware
├── next-env.d.ts // Next.js TypeScript environment declarations
├── next.config.js // Next.js configuration (JavaScript)
├── next.config.ts // Next.js configuration (TypeScript)
├── package-lock.json // npm lockfile for dependency consistency
├── package.json // Project metadata and dependencies
├── postcss.config.js // PostCSS configuration
├── public // Public static assets
│   ├── file.svg // General SVG asset
│   ├── globe.svg // Globe icon SVG
│   ├── next.svg // Next.js logo SVG
│   ├── vercel.svg // Vercel logo SVG
│   └── window.svg // Window/interface SVG icon
├── scripts // Maintenance and code generation scripts
│   └── generate-types.ts // Generates TypeScript types from backend schemas
├── supabase // Supabase configuration, migrations, and seeds
│   ├── config.toml // Supabase configuration (TOML)
│   ├── migrations // Database migration scripts
│   │   ├── 001_core_schema_and_auth_sessions.sql // Core schema and auth sessions
│   │   ├── 002_scheduling_and_session_management.sql // Scheduling and session management migrations
│   │   ├── 003_indexes_schema_improvements.sql // Schema indexing and performance improvements
│   │   ├── 004_test_helpers_setup.sql // Integration test helpers setup
│   │   ├── 005_fix_auth_permissions.sql // Fixes authentication permissions
│   │   ├── 20240320000000_phase4_features_part1.sql // Phase 4 features migration part 1
│   │   ├── 20240321000000_phase4_features_part2.sql // Phase 4 features migration part 2
│   │   ├── 20240321000000_phase4_features_part2.sql.bak // Backup for Phase 4 features migration part 2
│   │   ├── 20240322000000_add_rate_limiting.sql // Adds DB-level rate limiting
│   │   ├── 20240323000000_fix_audit_logs.sql // Fixes audit log table issues
│   │   ├── 20240324000000_rls_policies_phase1.sql // RLS policies implementation phase 1
│   │   ├── 20240324000001_rls_policies_phase2.sql // RLS policies implementation phase 2
│   │   └── 20250207212316_fix_test_helpers.sql // Fix test helper configuration issues
│   ├── seed.sql // Database seeding script
│   └── tests // Supabase configuration and migration tests
│       └── database // Database policy and setup tests
│           ├── 02_profile_policies.test.sql // Tests for profile policies
│           ├── 03_rls_policies.test.sql // Tests for RLS policies
│           └── 04_rls_policies_phase2.test.sql // Additional tests for RLS policies phase 2
├── tailwind.config.ts // Tailwind CSS configuration (TypeScript)
├── test // Additional project tests
│   ├── app // App-level tests
│   │   ├── (auth) // App auth tests
│   │   │   └── login // Login feature tests in app
│   │   │       └── login-form.test.tsx // Test for login form (duplicate test)
│   │   ├── (dashboard) // Dashboard functionality tests
│   │   │   ├── manage // Management functionality tests
│   │   │   │   ├── actions // Management action tests
│   │   │   │   │   ├── schedule.test.ts // Tests for scheduling actions
│   │   │   │   │   └── time-off.test.ts // Tests for time-off actions
│   │   │   │   └── components // Management components tests
│   │   │   │       ├── ScheduleManager.test.tsx // Test for ScheduleManager component
│   │   │   │       └── StaffingOverview.test.tsx // Dashboard StaffingOverview test
│   │   │   └── profile // Profile management tests
│   │   │       ├── actions.test.ts // Profile action tests
│   │   │       └── profile-form.test.tsx // Profile form component test
│   │   └── api // API endpoint tests
│   │       ├── admin // Admin API tests
│   │       │   ├── middleware.test.ts // Admin middleware tests
│   │       │   ├── route.test.ts // Admin route test
│   │       │   └── users // Admin user endpoint tests
│   │       │       ├── [id] // Dynamic user tests
│   │       │       │   └── route.test.ts // Dynamic user API test
│   │       │       └── route.test.ts // General admin users API test
│   │       └── auth // Auth API tests
│   │           ├── callback // Auth callback tests
│   │           │   └── route.test.ts // Auth callback API test
│   │           ├── cleanup // Auth cleanup tests
│   │           │   └── route.test.ts // Auth cleanup API test
│   │           ├── login // Auth login tests
│   │           │   └── route.test.ts // Auth login API test
│   │           └── signout // Auth signout tests
│   │               └── route.test.ts // Auth signout API test
├── tsconfig.json // TypeScript configuration
├── tsconfig.tsbuildinfo // Auto-generated TypeScript build info
├── types // Project-specific TypeScript type definitions
│   ├── auth.d.ts // Authentication type definitions
│   ├── database.ts // Database schema types
│   ├── profile.ts // User profile type definitions
│   ├── schedule.ts // Schedule data structures types
│   ├── scheduling.ts // Scheduling operations and logic types
│   ├── shift.ts // Shift detail types
│   ├── supabase // Supabase type definitions
│   │   └── database.ts // Supabase database schema types
│   ├── supabase.ts // General Supabase integration types
│   └── time-off.ts // Time-off request types
├── vitest.config.ts // Vitest configuration
└── vitest.setup.ts // Vitest initialization file
