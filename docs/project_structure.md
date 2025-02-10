. // Root directory: Contains the entire project structure
├── README.md // Project overview and documentation
├── __tests__ // Contains automated test files for the project
│   └── components // Tests for individual UI components
│       └── StaffingOverview.test.tsx // Unit test for the StaffingOverview component
├── app // Main application code (Next.js pages, routes, API endpoints, and layouts)
│   ├── (auth) // Authentication-related functionality (login, signup, password management, etc.)
│   │   ├── actions.ts // Implements authentication actions (e.g., handling login/signup actions)
│   │   ├── auth-error // Handles authentication error displays
│   │   │   └── page.tsx // Page component to show auth-related errors
│   │   ├── callback // Handles auth callbacks from external providers
│   │   │   └── route.ts // API route for processing authentication callbacks
│   │   ├── complete-profile // Manages the complete profile flow post-signup
│   │   │   └── page.tsx // Page for users to complete their profile details
│   │   ├── login // Contains components and pages for the login feature
│   │   │   ├── login-form.test.tsx // Tests for the login form component
│   │   │   ├── login-form.tsx // Login form component implementation
│   │   │   └── page.tsx // Login page component
│   │   ├── reset-password // Manages password reset functionality
│   │   │   ├── page.tsx // Page component for resetting password
│   │   │   └── reset-password-form.tsx // Form component for submitting a password reset
│   │   ├── signup // Handles user signup processes
│   │   │   ├── actions.ts // Signup logic and actions
│   │   │   ├── check-email // Manages email verification during signup
│   │   │   │   └── page.tsx // Page component for email check feedback
│   │   │   ├── page.tsx // Main signup page component
│   │   │   └── signup-form.tsx // Signup form component implementation
│   │   └── update-password // Allows authenticated users to update their password
│   │       ├── page.tsx // Page component for updating password
│   │       └── update-password-form.tsx // Form for updating the user password
│   ├── (dashboard) // Dashboard area for logged-in users, displaying various management tools
│   │   ├── employees // Manages employee-related views and pages
│   │   │   └── page.tsx // Page component showing employee details
│   │   ├── layout.tsx // Layout component for the dashboard section
│   │   ├── loading.tsx // Loading indicator component for dashboard pages
│   │   ├── manage // Section for managing scheduling and time-off functionality
│   │   │   ├── actions // Contains action files for management processes
│   │   │   │   ├── scheduling.ts // Handles scheduling actions
│   │   │   │   └── time-off.ts // Handles time-off request actions
│   │   │   ├── actions.ts // General management actions
│   │   │   ├── components // Reusable UI components for the management area
│   │   │   │   ├── RealtimeSchedule.tsx // Displays live schedule updates
│   │   │   │   ├── ScheduleManager.tsx // Interface for managing schedules
│   │   │   │   ├── StaffList.tsx // Lists staff members
│   │   │   │   ├── TimeOffRequestForm.tsx // Form for time-off requests
│   │   │   │   └── TimeOffRequests.tsx // Displays submitted time-off requests
│   │   │   ├── layout.tsx // Layout for the management section
│   │   │   ├── metadata.ts // Metadata configuration for management features
│   │   │   ├── overtime // Subsection focused on overtime management
│   │   │   │   ├── data-table.tsx // Data table to display overtime records
│   │   │   │   ├── loading.tsx // Loading indicator for the overtime section
│   │   │   │   └── page.tsx // Main page for overtime management
│   │   │   ├── page.tsx // Primary management page component
│   │   │   └── swaps // Handles shift swap functionalities
│   │   │       ├── calendar-view.tsx // Calendar visualization for shift swaps
│   │   │       ├── data-table.tsx // Displays shift swap data in a table
│   │   │       ├── loading.tsx // Loading state indicator for shift swaps
│   │   │       └── page.tsx // Main page for managing shift swaps
│   │   ├── overview // Provides an overview summary of dashboard data
│   │   │   └── page.tsx // Dashboard overview page component
│   │   ├── profile // Manages user profile data and settings
│   │   │   ├── actions.ts // Contains actions for updating profile information
│   │   │   ├── error.tsx // Renders error messages related to profile updates
│   │   │   ├── loading.tsx // Loading indicator for profile page
│   │   │   ├── page.tsx // Main profile page component
│   │   │   ├── password-form.tsx // Form to update user password within profile
│   │   │   └── profile-form.tsx // Form for editing profile details
│   │   ├── requirements // Section for managing staffing requirements
│   │   │   ├── _components // Private components used only in requirements
│   │   │   │   └── staffing-requirements-form.tsx // Form for entering staffing requirements
│   │   │   ├── actions.ts // Action file for staffing requirements operations
│   │   │   ├── create-button.tsx // Button to initiate creation of a requirement
│   │   │   ├── data-table.tsx // Table displaying staffing requirements data
│   │   │   ├── delete-dialog.tsx // Dialog for confirming deletion of a requirement
│   │   │   ├── edit-dialog.tsx // Dialog interface for editing requirements
│   │   │   ├── error.tsx // Error handling display for requirements
│   │   │   ├── layout.tsx // Layout specific to the requirements section
│   │   │   ├── loading.tsx // Loading indicator for the requirements page
│   │   │   ├── not-found.tsx // 404 page when a requirement is not found
│   │   │   └── page.tsx // Main page for staffing requirements
│   │   ├── schedules // Contains schedule-related pages and components
│   │   │   ├── calendar-view.tsx // Calendar view component for schedules
│   │   │   ├── create-button.tsx // Button to create a new schedule
│   │   │   ├── error.tsx // Error display for scheduling issues
│   │   │   ├── filters.tsx // Component to filter schedule listings
│   │   │   ├── list-view.tsx // List view component for schedules
│   │   │   ├── loading.tsx // Loading indicator for schedule pages
│   │   │   ├── page.tsx // Main schedules page component
│   │   │   └── view-options.tsx // Options to customize schedule display view
│   │   ├── settings // Contains dashboard settings components
│   │   │   ├── error.tsx // Renders errors on the settings page
│   │   │   ├── loading.tsx // Loading indicator for settings
│   │   │   └── page.tsx // Main settings page component
│   │   ├── shift-options // Manages different shift configuration options
│   │   │   ├── create-button.tsx // Button to create a new shift option
│   │   │   ├── data-table.tsx // Table listing available shift options
│   │   │   ├── delete-dialog.tsx // Dialog for confirming deletion of a shift option
│   │   │   ├── edit-dialog.tsx // Dialog for editing a shift option
│   │   │   ├── error.tsx // Displays errors pertaining to shift options
│   │   │   ├── loading.tsx // Loading indicator for shift options section
│   │   │   └── page.tsx // Main page for managing shift options
│   │   └── time-off // Section dedicated to time-off request management
│   │       ├── components // Contains components specific to time-off functionality
│   │       │   └── time-off-requests-wrapper.tsx // Wrapper component for time-off requests UI
│   │       ├── create-button.tsx // Button to create a new time-off request
│   │       ├── data-table.tsx // Data table displaying time-off requests
│   │       ├── filters.tsx // Component for filtering time-off requests
│   │       ├── loading.tsx // Loading indicator for the time-off section
│   │       └── page.tsx // Main page component for time-off requests
│   ├── api // Serverless API endpoints used by the app
│   │   ├── admin // API endpoints for administrative operations
│   │   │   ├── middleware.ts // Middleware for admin API authentication and authorization
│   │   │   ├── route.ts // Main API route for admin functions
│   │   │   └── users // API endpoints for user management under admin
│   │   │       ├── [id] // Dynamic route for operations on a specific user
│   │   │       │   └── route.ts // API route handler for a specific user based on ID
│   │   │       └── route.ts // API route for general user operations
│   │   └── auth // API endpoints for authentication operations
│   │       ├── callback // API endpoint for authentication callbacks
│   │       │   └── route.ts // Route handler for auth callback responses
│   │       ├── cleanup // Endpoint for cleaning up obsolete auth sessions
│   │       │   └── route.ts // API route for session cleanup
│   │       ├── force-signout // Endpoint to enforce user sign out
│   │       │   └── route.ts // API route to process force signout requests
│   │       ├── login // Handles API login requests
│   │       │   └── route.ts // Route handler for login API calls
│   │       ├── session // Manages session-related API endpoints
│   │       │   └── refresh // Endpoint to refresh user sessions
│   │       │       └── route.ts // API route to refresh authentication sessions
│   │       └── signout // Handles API signout requests
│   │           └── route.ts // API route for processing user signout
│   ├── error // Contains error page components for the application
│   │   └── page.tsx // Custom error page component
│   ├── error.tsx // Global error component to catch and render errors
│   ├── favicon.ico // Favicon icon file for the application
│   ├── global-error.tsx // Global error boundary to capture uncaught errors
│   ├── globals.css // Global stylesheet for application-wide styles
│   ├── hooks // Custom React hooks used exclusively within the app layer
│   │   ├── use-employee-schedule.ts // Hook to manage and fetch employee schedule data
│   │   └── useRealtimeSubscription.ts // Hook for managing real-time data subscriptions
│   ├── layout.tsx // Root layout component which wraps app pages
│   ├── loading.tsx // Global loading component used during page transitions
│   ├── not-found.tsx // 404 not found page component for missing routes
│   ├── page.tsx // Primary entry point page for the application
│   ├── providers // Provides context and state management for the app
│   │   └── supabase-provider.tsx // Supplies the Supabase client context to components
│   └── schedule // Contains scheduling features and related UI
│       ├── _components // Private components used in schedule management
│       │   ├── schedule-manager.tsx // Component to manage schedule creation and editing
│       │   ├── shift-calendar.tsx // Calendar to visualize shifts
│       │   ├── shift-update-form.tsx // Form for updating shift details
│       │   └── staffing-requirements.tsx // Displays staffing requirements within schedules
│       ├── page.tsx // Main scheduling page component
│       └── shift-swaps // Handles shift swap functionalities within scheduling
│           └── page.tsx // Page component for managing shift swap requests
├── components // Reusable UI components across the project
│   ├── StaffingOverview.tsx // Component to display an overview of staffing information
│   ├── auth // UI components related to authentication
│   │   └── sign-out-button.tsx // Button component for signing out users
│   ├── calendar // Components dealing with calendar views and interactions
│   │   └── ShiftCalendar.tsx // Calendar component for visualizing shifts
│   ├── dashboard // UI elements specific to dashboard features (may include subcomponents)
│   ├── employees // Components for managing employee-related UI
│   │   ├── create-button.tsx // Button to create a new employee entry
│   │   ├── data-table.tsx // Table component to list employee data
│   │   ├── delete-dialog.tsx // Dialog for confirming deletion of an employee record
│   │   ├── edit-dialog.tsx // Dialog for editing employee details
│   │   └── loading.tsx // Loading indicator component for employee sections
│   ├── error-boundary.tsx // Boundary component to catch and handle UI errors
│   ├── forms // Form components used throughout the application
│   │   ├── ScheduleForm.tsx // Form for creating or editing schedules
│   │   ├── ShiftUpdateForm.tsx // Form for updating shift information
│   │   └── TimeOffRequestForm.tsx // Form for submitting a time-off request
│   ├── layout // Layout components for client-side views
│   │   └── client-layout.tsx // Layout used to structure client-side pages
│   ├── profile // UI components for user profile features
│   │   └── profile-form.tsx // Form component for editing user profiles
│   ├── providers // React context providers for global app state
│   │   ├── AuthProvider.tsx // Provides authentication context to the app
│   │   ├── root-provider.tsx // Wraps the app with all required providers
│   │   ├── supabase-provider.tsx // Supplies the Supabase client to components
│   │   ├── theme-provider.tsx // Provides theming support across the app
│   │   └── tooltip-provider.tsx // Provides tooltip functionality for UI elements
│   ├── schedule // Components related to scheduling UI
│   │   └── schedule-calendar.tsx // Calendar view component for schedule management
│   ├── theme-provider.tsx // Standalone theme provider for styling purposes
│   └── ui // Basic UI components and building blocks (atoms/molecules)
│       ├── alert-dialog.tsx // Component for rendering alert dialogs
│       ├── alert.tsx // Simple alert notification component
│       ├── avatar.tsx // Avatar component for user profile images
│       ├── badge.tsx // UI badge component for labels or statuses
│       ├── button.tsx // Reusable button component
│       ├── calendar.tsx // Basic calendar UI element
│       ├── card.tsx // Card component for content display
│       ├── checkbox.tsx // Checkbox input component
│       ├── dialog.tsx // Generic dialog/modal component
│       ├── dropdown-menu.tsx // Dropdown menu component for navigation or options
│       ├── error-boundary.tsx // UI error boundary for catching component errors
│       ├── errors.tsx // Component to display error messages in the UI
│       ├── form.tsx // Generic form wrapper component
│       ├── header.tsx // Header component for app sections
│       ├── input.tsx // Text input component
│       ├── label.tsx // Label element for form inputs
│       ├── loading-spinner.tsx // Spinner component used during loading states
│       ├── loading.tsx // Simple loading indicator component
│       ├── main-nav.tsx // Main navigation bar component
│       ├── popover.tsx // Popover component for contextual overlays
│       ├── progress.tsx // Progress bar component
│       ├── radio-group.tsx // Radio button group component
│       ├── scroll-area.tsx // Scrollable container component
│       ├── select.tsx // Select dropdown input component
│       ├── separator.tsx // Visual separator component for layout
│       ├── sheet.tsx // Slide-over sheet component for menus/dialogs
│       ├── sidebar-nav.tsx // Sidebar navigation component
│       ├── sign-out-button.tsx // Button for signing out (UI duplicate)
│       ├── skeleton.tsx // Skeleton loader component for content placeholders
│       ├── sonner.tsx // Component related to the Sonner notification system
│       ├── switch.tsx // Toggle switch input component
│       ├── table.tsx // Table component for data presentation
│       ├── tabs.tsx // Tab navigation component
│       ├── textarea.tsx // Multi-line text area component
│       ├── theme-toggle.tsx // Toggle component to switch between themes
│       ├── toast.tsx // Toast notification component
│       ├── toaster.tsx // Container component for displaying toast notifications
│       ├── tooltip.tsx // Tooltip component for extra information
│       ├── use-toast.ts // Custom hook to trigger toast notifications
│       └── user-nav.tsx // User navigation component (links to profile, settings, etc.)
├── components.json // JSON configuration for components (used by tooling or documentation)
├── docs // Documentation files outlining project policies and design
│   ├── SECURITY.md // Security guidelines and best practices
│   ├── project_requirements_document.md // Detailed list of project requirements
│   ├── rls_policies.md // Documentation for row-level security policies
│   ├── scheduling_logic_document.md // Explanation of scheduling algorithms and logic
│   └── supabase-db-overview.md // Overview of the Supabase database schema and structure
├── eslint.config.mjs // ESLint configuration file (in MJS format)
├── hooks // Additional custom hooks used across the project (outside the app directory)
│   ├── use-auth.ts // Hook handling authentication logic
│   ├── use-employee-schedule.ts // Hook for managing employee schedules (duplicate of app/hooks)
│   ├── use-media-query.ts // Hook for handling responsive design via media queries
│   └── use-toast.ts // Hook for managing toast notifications (duplicate of ui/use-toast)
├── jwt_config.sql // SQL script for configuring JSON Web Token (JWT) settings
├── lib // Library of helper utilities and internal APIs
│   ├── api-utils.ts // Utility functions for API operations
│   ├── auth // Library code for authentication handling
│   │   ├── client.ts // Client-side authentication utilities
│   │   ├── middleware.ts // Middleware for API authentication
│   │   └── server.ts // Server-side authentication helper functions
│   ├── auth.ts // General authentication utility functions
│   ├── config.server.ts // Server-only configuration settings
│   ├── config.ts // General configuration file for the project
│   ├── env.public.ts // Public environment variable definitions
│   ├── env.server.ts // Server environment variable settings
│   ├── env.ts // Combined environment variable configuration
│   ├── hooks // Shared hooks for library-level features
│   │   ├── index.ts // Exports for shared hooks
│   │   ├── use-auth-mutations.ts // Hook for authentication mutation operations
│   │   ├── use-auth.ts // Hook to access authentication state
│   │   ├── use-employees.ts // Hook for managing employee data
│   │   ├── use-query.ts // Hook for performing data queries
│   │   ├── use-schedule-mutations.ts // Hook for schedule mutation operations
│   │   ├── use-schedules.ts // Hook for fetching and managing schedules
│   │   ├── use-shift-swaps.ts // Hook for managing shift swap operations
│   │   ├── use-shifts.ts // Hook for handling shift data
│   │   ├── use-staffing-requirements.ts // Hook for managing staffing requirements data
│   │   └── use-time-off.ts // Hook for time off request handling
│   ├── providers // Provider components for library-level state management
│   │   └── query-provider.tsx // Provider for managing and caching API queries
│   ├── rate-limit.ts // Implements logic for API rate limiting
│   ├── schedule.ts // Utility functions related to scheduling operations
│   ├── scheduling // Contains helper functions for scheduling logic
│   │   ├── conflicts.ts // Functions to detect scheduling conflicts
│   │   ├── generate.ts // Functions to generate schedule structures
│   │   ├── helpers.ts // Miscellaneous scheduling helper utilities
│   │   ├── scoring.ts // Algorithms for scoring shift assignments
│   │   └── tracking.ts // Utilities to track scheduling changes and events
│   ├── supabase // Supabase integration and helper utilities
│   │   ├── auth.ts // Supabase-specific authentication utilities
│   │   ├── client.ts // Initializes the Supabase client
│   │   ├── cookie-adapter.ts // Adapter for cookie management with Supabase
│   │   ├── data-access // Data access layer for Supabase interactions
│   │   │   ├── employees.ts // Data functions for employee records
│   │   │   ├── schedules.ts // Functions to access schedule data
│   │   │   ├── shifts.ts // Functions to access shift data
│   │   │   └── time-off.ts // Functions to manage time off data
│   │   ├── data-access.ts // Aggregate utilities for data access via Supabase
│   │   ├── realtime.ts // Setup for Supabase real-time subscriptions
│   │   ├── server.ts // Server-side utilities for interacting with Supabase
│   │   └── service.ts // Service layer interfacing with Supabase APIs
│   ├── supabase-mock.ts // Mock implementation of Supabase for testing purposes
│   ├── utils // General utility functions used across the project
│   │   ├── error-handler.ts // Centralized error handling functions
│   │   └── query.ts // Utility for constructing API queries
│   ├── utils.ts // Miscellaneous utility functions
│   └── validations // Schema validation and data-check utilities
│       ├── schemas.ts // Data validation schemas for various models
│       └── shift.ts // Validation rules specific to shift data
├── middleware // Custom middleware implementations for API handling
│   └── rate-limit.ts // Middleware to enforce API rate limiting on requests
├── middleware.ts // Global middleware for the application
├── next-env.d.ts // Next.js TypeScript environment declaration file
├── next.config.js // Next.js configuration file (JavaScript version)
├── next.config.ts // Next.js configuration file (TypeScript version)
├── package-lock.json // Lockfile for npm, ensuring consistent dependency versions
├── package.json // Project metadata, scripts, and dependency definitions
├── postcss.config.js // Configuration file for PostCSS processing
├── public // Static assets served directly by the web server
│   ├── file.svg // SVG asset (general purpose file image)
│   ├── globe.svg // SVG image of a globe icon
│   ├── next.svg // Next.js logo asset
│   ├── vercel.svg // Vercel logo asset
│   └── window.svg // SVG icon representing a window/interface element
├── scripts // Utility scripts for maintenance and code generation
│   └── generate-types.ts // Script to generate TypeScript types from backend schemas
├── supabase // Contains Supabase configuration, migrations, and seed data
│   ├── config.toml // Supabase configuration file in TOML format
│   ├── migrations // Database migration scripts for setting up schema and policies
│   │   ├── 001_core_schema_and_auth_sessions.sql // Sets up core schema and auth session tables
│   │   ├── 002_scheduling_and_session_management.sql // Adds scheduling and session management features
│   │   ├── 003_indexes_schema_improvements.sql // Improves indexes and overall schema performance
│   │   ├── 004_test_helpers_setup.sql // Sets up helpers for integration testing
│   │   ├── 005_fix_auth_permissions.sql // Fixes permissions related to authentication
│   │   ├── 20240320000000_phase4_features_part1.sql // Migration for phase 4 features (part 1)
│   │   ├── 20240321000000_phase4_features_part2.sql // Migration for phase 4 features (part 2)
│   │   ├── 20240321000000_phase4_features_part2.sql.bak // Backup of migration for phase 4 features (part 2)
│   │   ├── 20240322000000_add_rate_limiting.sql // Adds database-level rate limiting support
│   │   ├── 20240323000000_fix_audit_logs.sql // Fixes issues with audit log tables
│   │   ├── 20240324000000_rls_policies_phase1.sql // Implements row-level security policies (phase 1)
│   │   ├── 20240324000001_rls_policies_phase2.sql // Implements row-level security policies (phase 2)
│   │   └── 20250207212316_fix_test_helpers.sql // Fixes issues with test helper configurations
│   ├── seed.sql // SQL script to seed the database with initial data
│   └── tests // Contains tests for Supabase configuration and migrations
│       └── database // SQL test files for verifying database policies and setups
│           ├── 02_profile_policies.test.sql // Tests for user profile policies
│           ├── 03_rls_policies.test.sql // Tests for row-level security policies
│           └── 04_rls_policies_phase2.test.sql // Additional tests for RLS policies phase 2
├── tailwind.config.ts // Tailwind CSS configuration file (TypeScript version)
├── test // Additional test files covering various aspects of the project
│   ├── app // Tests specifically for app-level functionality
│   │   ├── (auth) // Authentication tests within the app context
│   │   │   └── login // Tests for the login feature in the app
│   │   │       └── login-form.test.tsx // Test for the login form component (duplicate test)
│   │   ├── (dashboard) // Dashboard functionality tests
│   │   │   ├── manage // Tests related to management actions and components
│   │   │   │   ├── actions // Tests for management action files
│   │   │   │   │   ├── schedule.test.ts // Tests for scheduling action logic
│   │   │   │   │   └── time-off.test.ts // Tests for time-off action logic
│   │   │   │   └── components // Tests for components within the management section
│   │   │   │       ├── ScheduleManager.test.tsx // Tests for the ScheduleManager component
│   │   │   │       └── StaffingOverview.test.tsx // Tests for StaffingOverview in dashboard context
│   │   │   └── profile // Tests for profile management features
│   │   │       ├── actions.test.ts // Tests for profile action handlers
│   │   │       └── profile-form.test.tsx // Tests for the profile form component
│   │   └── api // Tests for API endpoint functionalities
│   │       ├── admin // Admin API endpoint tests
│   │       │   ├── middleware.test.ts // Tests for admin middleware logic
│   │       │   ├── route.test.ts // Tests for the admin API route
│   │       │   └── users // Tests for admin user-related API endpoints
│   │       │       ├── [id] // Tests for dynamic user-specific routes
│   │       │       │   └── route.test.ts // Test for the user-specific API route
│   │       │       └── route.test.ts // Tests for the general users API route
│   │       └── auth // Authentication API endpoint tests
│   │           ├── callback // Tests for the auth callback endpoint
│   │           │   └── route.test.ts // Test for the auth callback API route
│   │           ├── cleanup // Tests for the auth cleanup endpoint
│   │           │   └── route.test.ts // Test for the cleanup API route
│   │           ├── login // Tests for the auth login endpoint
│   │           │   └── route.test.ts // Test for the login API route
│   │           └── signout // Tests for the auth signout endpoint
│   │               └── route.test.ts // Test for the signout API route
├── tsconfig.json // TypeScript compiler configuration file
├── tsconfig.tsbuildinfo // Auxiliary TypeScript build info (auto-generated)
├── types // Custom TypeScript type definitions for the project
│   ├── auth.d.ts // Type definitions related to authentication
│   ├── database.ts // Database schema type definitions
│   ├── profile.ts // Type definitions for user profile data
│   ├── schedule.ts // Types for schedule data structures
│   ├── scheduling.ts // Types for scheduling operations and logic
│   ├── shift.ts // Type definitions for shift details
│   ├── supabase // Supabase-specific type definitions
│   │   └── database.ts // Types for the Supabase database schema
│   ├── supabase.ts // General type definitions for Supabase integration
│   └── time-off.ts // Types related to time-off and leave requests
├── vitest.config.ts // Configuration for the Vitest testing framework
└── vitest.setup.ts // Setup file for initializing Vitest testing environment
