# Project Structure

## Overview

This document outlines the organization of the project's codebase.

## Project File Structure

```                                
```markdown
# Project Structure Comments

- **README.md**  
  // Provides an overall project overview, setup instructions, usage guidelines, and documentation.

- **__tests__/**  
  // Contains all test files that verify the functionality of the application.
  - **README.md**  
    // Explains the testing strategy, test organization, and directory structure.
  - **app/**  
    // Holds tests specific to the routes and components inside the `app` directory.
    - **(auth)/**  
      // Contains tests related to authentication routes and components.
    - **(dashboard)/**  
      // Contains tests for dashboard-related functionality including manage and profile pages.
    - **actions/**  
      // Tests for server actions (e.g., API route actions or server-side functionality).
    - **api/**  
      // Tests for API endpoints; subdivided into admin and auth-related tests.
    - **components/**  
      // Tests for components used in the application, ensuring UI and server components work as expected.
    - **e2e/**  
      // End-to-end (E2E) tests simulating complete user flows, including scheduling.
    - **integration/**  
      // Contains integration tests that verify the interaction between multiple units of code, such as scheduling.
    - **performance/**  
      // Tests that check web vitals and performance metrics.
    - **realtime/**  
      // Ensures real-time features (e.g., subscriptions, live updates) work correctly.
  - **components/**  
    // Contains tests specifically for shared UI components (like StaffingOverview).
  - **e2e/**  
    // Additional E2E tests focused on feature-level user interactions.
  - **helpers/**  
    // Provides helper functions, mocks, and utilities used across tests.
  - **hooks/**  
    // Tests for custom React hooks used in the project.
  - **integration/**  
    // Additional integration tests covering API and database interactions.
  - **lib/**  
    // Tests for library utilities such as auth or scheduling helpers.
  - **mocks/**  
    // Contains mock data and services to simulate external dependencies during testing.
  - **setup.ts**  
    // Global test setup file that configures the testing environment before tests run.
  - **unit/**  
    // Contains unit tests for isolated pieces of code including hooks and utility functions.
  - **utils/**  
    // Shared testing utilities and additional mocks for various test scenarios.

- **app/**  
  // Contains the main Next.js application code following the App Router convention.
  - **(auth)/**  
    // Logical grouping for authentication-related routes (e.g., login, signup, password reset); the group folder is not reflected in the URL.
    - **actions.ts**  
      // Holds server-side actions related to authentication.
    - **auth-error/**  
      // Contains error handling pages/components for authentication errors.
    - **callback/**  
      // Manages callback routes, such as those for OAuth completions.
    - **complete-profile/**  
      // Contains the page for users to complete their profile details.
    - **components/**  
      // Contains authentication UI components like sign-out button and user auth form.
    - **layout.tsx**  
      // The layout component wrapping all the (auth) pages.
    - **login/**  
      // Contains the login page, its form (with tests) and associated UI.
    - **reset-password/**  
      // Pages and forms for resetting a user's password.
    - **signup/**  
      // Contains the signup related actions, forms, and email verification components.
    - **update-password/**  
      // Contains pages and forms that allow a user to update their password.
  - **(dashboard)/**  
    // Logical grouping for dashboard and managerial features.
    - **employees/**  
      // The route for employee management.
    - **layout.tsx**  
      // The common layout for the dashboard pages.
    - **loading.tsx**  
      // A loading state component for the dashboard.
    - **manage/**  
      // Contains various pages and UI for managing the dashboard, including actions, layouts, and metadata.
    - **overview/**  
      // Provides a dashboard overview including components and pages.
    - **profile/**  
      // Contains routes and components for user profile management.
    - **requirements/**  
      // Handles staffing or scheduling requirements including UI components like data tables and dialogs.
    - **schedules/**  
      // Manages scheduling views, including calendar and list views, filters, and loading states.
    - **settings/**  
      // Contains settings pages with error and loading components.
    - **shift-options/**  
      // Contains UI components and pages related to configuring shift options.
    - **time-off/**  
      // Provides pages and components for requesting and handling time-off.
  - **__tests__/**  
    // Additional tests specific to the app routes (e.g., authentication tests).
  - **actions/**  
    // Contains shared server actions for features like auth and schedule adjustments.
  - **api/**  
    // API route definitions for backend operations.
    - **admin/**  
      // API endpoints and middleware for admin-level operations.
    - **auth/**  
      // API endpoints that handle authentication-related actions.
  - **components/**  
    // Contains route-specific components, including server-rendered components and error boundaries.
  - **error/**  
    // Contains static and dynamic error pages and error boundaries for routes.
  - **favicon.ico**  
    // The website's favicon rendered in browsers.
  - **global-error.tsx**  
    // Global error boundary component handling critical application errors.
  - **globals.css**  
    // Global CSS styles applied across the application.
  - **layout.tsx**  
    // The root layout component that wraps the entire application.
  - **lib/**  
    // Contains libraries and helper utilities for API calls, authentication, configuration, and other app-level logic.
    - **api-utils.ts**  
      // Helper utilities for making API requests.
    - **auth/**  
      // Provides client- and server-side authentication utilities.
    - **config.server.ts & config.ts**  
      // Configuration files for the application, separating server and client settings.
    - **env*.ts**  
      // Environment configuration files for public and server-side environments.
    - **hooks/**  
      // Contains custom React hooks used across the app (e.g., for auth, scheduling).
    - **middleware/**  
      // Contains middleware utilities (e.g., rate-limiting).
    - **providers/**  
      // Context providers such as the query provider for state management.
    - **rate-limit.ts**  
      // Implements rate limiting logic for API requests.
    - **schedule.ts & scheduling/**  
      // Contains scheduling logic, including conflict detection, generation, scoring, and validation of schedules.
    - **supabase/**  
      // Contains utilities for integrating with Supabase for authentication and data access.
    - **utils/**  
      // Utility functions including error code mapping, query helpers, and staffing patterns.
  - **middleware.ts**  
    // Global middleware configuration applied to incoming requests (e.g., for authentication and static resource filtering).
  - **next-env.d.ts**  
    // Provides Next.js-related TypeScript definitions.
  - **next.config.mjs**  
    // Configuration file for Next.js, setting up routing, build options, etc.
  - **page.tsx**  
    // The main entry point/page for the root route.
  - **providers/**  
    // Contains higher-order provider components (e.g., theme, Supabase, query providers) for wrapping the app.
  - **schedule/**  
    // Contains everything related to the scheduling feature.
    - **README.md**  
      // Documentation describing the scheduling component architecture and usage.
    - **_components/**  
      // Private components used only within the schedule route (e.g., schedule manager, shift calendar, staffing requirements, and time-off requests).
    - **error.tsx**  
      // Handles errors specific to scheduling routes.
    - **layout.tsx**  
      // Layout component for the scheduling route.
    - **loading.tsx**  
      // Loading state component for scheduling.
    - **page.tsx**  
      // Main scheduling interface page.
    - **shift-swaps/**  
      // Contains components and pages handling shift swap functionality.
  - **types/**  
    // Contains TypeScript type definitions and interfaces applicable throughout the app.
    - **api/**  
      // Defines shapes of API responses.
    - **auth.d.ts**  
      // Type definitions for authentication data.
    - **database.ts**  
      // Type definitions for database interactions.
    - **errors.ts**  
      // Global error type definitions.
    - **forms/**  
      // Type definitions for form data.
    - **index.ts**  
      // Central export file for type definitions.
    - **models/**  
      // Data models defining structures for employees, schedules, shifts, and time-off.
    - **profile.ts**  
      // Type definitions related to user profiles.
    - **realtime.ts**  
      // Types for real-time updates and subscriptions.
    - **routes.ts**  
      // Defines route-specific types.
    - **schedule.ts & scheduling/**  
      // Types related to scheduling logic and shift details.
    - **shared/**  
      // Shared type definitions used across multiple features.
    - **supabase/**  
      // Type definitions specific to Supabase interactions.
    - **supabase.ts**  
      // Global type definitions for Supabase.
    
- **components/**  
  // Contains reusable UI components that can be used throughout the application.
  - **calendar/**  
    // Calendar components for date and event selections.
  - **dashboard/**  
    // Components specific to dashboard layouts and interactions.
  - **employees/**  
    // UI components for employee-related features (e.g., create button, data table, dialogs).
  - **features/**  
    // Feature-specific components grouped by business logic.
    - **employees/**  
      // Contains components like employee selectors.
    - **schedule/**  
      // Contains scheduling-specific UI components (e.g., Calendar, ShiftEditor).
  - **layout/**  
    // Contains layout components for structuring pages (e.g., client-layout).
  - **profile/**  
    // Components for user profile forms and display.
  - **schedule/**  
    // Contains scheduling UI components that might be shared or reused (e.g., schedule calendar).
  - **shared/**  
    // Shared components used across multiple features (e.g., error displays, layouts).
  - **ui/**  
    // Contains base UI components (e.g., button, input, card, alerts, modals) built using Shadcn UI and styled with Tailwind.
  
- **components.json**  
  // Likely a manifest or configuration file listing reusable component metadata.

- **database/**  
  // Contains database-related assets.
  - **README.md**  
    // Documentation on database management, structure, migrations, and testing.
  - **config.toml**  
    // Supabase configuration settings.
  - **migrations/**  
    // SQL migration files for schema changes (e.g., initial migration script).
  - **seed.sql**  
    // SQL script for seeding the database with initial data.
  - **test-trigger.sql**  
    // SQL file used for testing database triggers.
  - **tests/**  
    // Contains database-specific tests to verify migrations, constraints, and RLS policies.
    - **database/**  
      // Additional SQL test scripts for constraints, RLS policies, and helper functions.
  
- **docs/**  
  // Holds project documentation.
  - **SECURITY.md**  
    // Security guidelines and policies for the project.
  - **project_requirements_document.md**  
    // Detailed requirements and objectives of the scheduling system.
  - **project_structure.md**  
    // Documentation explaining the organization and structure of the codebase.
  - **rls_policies.md**  
    // Documentation for Supabase Row Level Security policies.
  - **scheduling_logic_document.md**  
    // Describes the business logic and rules for scheduling shifts.
  - **supabase-db-overview.md**  
    // Overview of the Supabase database integration and configuration.
  
- **eslint.config.mjs**  
  // ESLint configuration file for maintaining code quality and enforcing coding standards.

- **jwt_config.sql**  
  // SQL script for configuring JWT settings related to authentication.

- **lib/**  
  // Contains library code and shared utilities used across the application.
  - **hooks/**  
    // Custom React hooks organized by client and server usage.
    - **client/**  
      // Hooks intended for client-side only logic (e.g., use-auth, use-media-query, use-toast).
    - **index.ts**  
      // Exports of hooks.
    - **server/**  
      // Server-side hooks for operations like schedule fetching and error handling.
  - **supabase/**  
    // Contains Supabase server-side utilities (e.g., client initialization and helper functions).
  - **utils/**  
    // General utility functions such as error handling and logging.
    - **error-handler.ts**  
      // Maps error codes to user-friendly messages.
  - **utils.ts**  
    // Miscellaneous utility functions used throughout the project.
  
- **middleware.ts**  
  // Global middleware configuration for routing, authentication, and request handling.

- **next-env.d.ts**  
  // TypeScript definitions generated by Next.js for environment variables and types.

- **next.config.mjs**  
  // Next.js configuration file managing build options, custom routing, and more.

- **package-lock.json & package.json**  
  // Manage project dependencies and define npm scripts and metadata.

- **postcss.config.js**  
  // Configuration for PostCSS, used in processing Tailwind CSS and other CSS transformations.

- **public/**  
  // Contains publicly served static assets such as images and icons.
  - **file.svg, globe.svg, next.svg, vercel.svg, window.svg**  
    // Various SVG assets used as icons or illustrations in the project.

- **scripts/**  
  // Contains custom scripts, for example for testing or other automation tasks.
  - **test-signup.ts**  
    // A script that likely simulates or tests the signup process.

- **tailwind.config.ts**  
  // Tailwind CSS configuration file to customize styles and configure purge settings.

- **tsconfig.json & tsconfig.tsbuildinfo**  
  // TypeScript configuration files defining compiler options and build information.

- **types/**  
  // Contains global TypeScript type definitions used throughout the project.
  - **models/**  
    // Data models defining TypeScript interfaces for entities like employees and shifts.
  - **scheduling/**  
    // Type definitions specific to scheduling functionality.
  - **supabase/**  
    // Type definitions for Supabase database integration.
  - **supabase.ts**  
    // Global types for Supabase-related data structures.
  - **Other files (e.g., api, auth.d.ts, errors.ts, forms, index.ts, profile.ts, realtime.ts, routes.ts, shared)**  
    // Each file provides types and interfaces to ensure type safety for the respective module.

- **vitest.config.ts & vitest.setup.ts**  
  // Configuration and setup files for Vitest, the testing framework used to run unit and integration tests.
```

---

This breakdown provides comments on the purpose of each major file and folder in the repository, aligning with Next.js 14, TypeScript, and Supabase best practices.
```

```

## Component Organization

### UI Components
- Located in `components/ui/`
- Base components from shadcn/ui
- Consistent styling and behavior
- Examples: Button, Input, Card

### Feature Components
- Located in `components/features/`
- Specific to business features
- Composed of UI components
- Examples: Calendar, ShiftEditor, EmployeeSelector

### Shared Components
- Located in `components/shared/`
- Used across multiple features
- Common layouts and error handling
- Examples: DashboardLayout, ErrorBoundary

## Best Practices

1. Component Structure
   - Use named exports
   - Include displayName
   - Add proper TypeScript types
   - Include JSDoc comments for complex props

2. File Organization
   - Group related components
   - Keep files focused and small
   - Use index files for exports

3. Testing
   - Co-locate test files
   - Use proper test utilities
   - Follow testing patterns

4. Styling
   - Use Tailwind CSS
   - Follow class ordering
   - Use cn utility for conditionals

## Dependencies

- Next.js 14 (App Router)
- TypeScript
- Supabase
- shadcn/ui
- Tailwind CSS
- date-fns
- React Query

## Development Guidelines

1. Component Creation
   - Start with UI components
   - Compose feature components
   - Add proper types
   - Include tests

2. State Management
   - Use React Query for server state
   - Local state with useState/useReducer
   - Context for shared state

3. Data Fetching
   - Server Components first
   - React Query for client state
   - Proper error handling

4. Performance
   - Lazy loading when needed
   - Proper suspense boundaries
   - Optimistic updates
