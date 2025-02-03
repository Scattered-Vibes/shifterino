# Project Structure

This document provides an overview of the project structure, emphasizing clarity, separation of concerns, and logical grouping while maintaining clean URL paths. The structure below reflects the current state of the codebase:

The URL paths will be `/` for the top-level page and `/settings` for the settings page—even though both files are grouped under `(dashboard)`. This approach improves code organization:
- **Separation of Concerns:** Group related routes together without influencing their URL structure.
- **Nested Layouts:** Easily apply a common layout or loading skeleton to a set of pages.
- **Clean URLs:** Keep URLs simple and free from extraneous directory names used for grouping.

For more detailed information, you can review the official Next.js documentation on [Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups).

```bash
.
├── README.md                      # Project overview, setup instructions, and features documentation
├── STATUS.md                      # Current project status, milestones, and known issues
├── app/                           # Next.js 14 App Router directory - main application code
│   ├── (auth)/                   # Route group for authentication-related pages
│   │   ├── login/                # Login page and functionality
│   │   │   ├── actions.ts        # Server actions for login form handling
│   │   │   └── page.tsx          # Login page component
│   │   └── signup/               # Signup flow pages
│   │       ├── actions.ts        # Server actions for signup form handling
│   │       ├── check-email/      # Email verification page
│   │       │   └── page.tsx      # Email verification component
│   │       └── page.tsx          # Signup page component
│   ├── (dashboard)/              # Route group for authenticated dashboard pages
│   │   ├── layout.tsx            # Shared dashboard layout component
│   │   ├── manage/               # Management interface pages
│   │   │   ├── components/       # Reusable dashboard components
│   │   │   │   ├── ScheduleManager.tsx    # Schedule management interface
│   │   │   │   ├── StaffList.tsx          # Staff listing and management
│   │   │   │   ├── StaffingOverview.tsx   # Staffing level overview
│   │   │   │   └── TimeOffRequests.tsx    # Time-off request management
│   │   │   └── page.tsx          # Management dashboard page
│   │   └── page.tsx              # Main dashboard page
│   ├── _types/                   # App-specific TypeScript type definitions
│   │   └── database.ts           # Database schema types
│   ├── api/                      # API routes directory
│   │   └── v1/                   # Version 1 API endpoints
│   ├── auth/                     # Authentication API routes
│   │   └── callback/             # OAuth callback handling
│   │       └── route.ts          # Callback route handler
│   ├── favicon.ico               # Site favicon
│   ├── globals.css               # Global CSS styles
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Home page component
├── components/                    # Shared React components
│   └── ui/                       # Shadcn UI components
│       ├── button.tsx            # Button component
│       ├── calendar.tsx          # Calendar component
│       ├── card.tsx              # Card component
│       ├── dialog.tsx            # Dialog/modal component
│       ├── form.tsx              # Form components
│       ├── input.tsx             # Input component
│       ├── label.tsx             # Label component
│       ├── select.tsx            # Select component
│       ├── sheet.tsx             # Sheet/drawer component
│       ├── table.tsx             # Table component
│       └── tabs.tsx              # Tabs component
├── components.json               # Shadcn UI configuration
├── documentation/                # Project documentation files
│   ├── app_flow_document.md      # Application flow documentation
│   ├── backend_structure_document.md  # Backend architecture documentation
│   ├── cursorrules_file.md      # Cursor IDE rules and settings
│   ├── file_structure_document.md # Detailed file structure guide
│   ├── frontend_guidelines_document.md # Frontend development guidelines
│   ├── implementation_plan.md    # Project implementation roadmap
│   ├── project_requirements_document.md # Project requirements specification
│   ├── project_structure.md      # This file - project structure overview
│   ├── starter_tech_stack_document.md # Initial tech stack documentation
│   └── tech_stack_document.md    # Current tech stack documentation
├── eslint.config.mjs             # ESLint configuration
├── lib/                          # Shared utility libraries
│   ├── supabase/                 # Supabase client configuration
│   │   ├── client.ts             # Browser-side Supabase client
│   │   └── server.ts             # Server-side Supabase client
│   └── utils.ts                  # General utility functions
├── middleware.ts                 # Next.js middleware for auth and routing
├── next-env.d.ts                 # Next.js TypeScript declarations
├── next.config.js               # Next.js configuration
├── next.config.ts               # TypeScript Next.js configuration
├── package-lock.json            # NPM dependency lock file
├── package.json                 # Project dependencies and scripts
├── postcss.config.mjs           # PostCSS configuration
├── public/                      # Static assets directory
│   ├── file.svg                 # File icon
│   ├── globe.svg                # Globe icon
│   ├── next.svg                 # Next.js logo
│   ├── vercel.svg               # Vercel logo
│   └── window.svg               # Window icon
├── supabase/                    # Supabase configuration and migrations
│   ├── config.toml              # Supabase project configuration
│   └── migrations/              # Database migration files
│       └── 20250214_initial_schema.sql  # Initial database schema
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── types/                       # Global TypeScript type definitions
    └── database.ts              # Database type definitions
```   

**Route Grouping:**

Route grouping in the Next.js App Router is a feature that lets you organize your file structure without affecting your URL paths. By wrapping a folder name in parentheses (for example, `(dashboard)`), Next.js treats the folder as a logical group. This means that while files inside this folder can benefit from shared layouts, metadata, or loading states, the parentheses-wrapped folder itself isn't reflected in the URL.

For example, if you structure your project like this:

```
app/
└── (dashboard)/
    ├── layout.tsx   // Shared layout for all routes in this group
    ├── page.tsx     // Renders at the root URL '/'
    └── settings/
        └── page.tsx // Renders at '/settings'
```

The URL paths will be `/` for the top-level page and `/settings` for the settings page—even though both files are grouped under `(dashboard)`. This approach improves code organization:
- **Separation of Concerns:** Group related routes together without influencing their URL structure.
- **Nested Layouts:** Easily apply a common layout or loading skeleton to a set of pages.
- **Clean URLs:** Keep URLs simple and free from extraneous directory names used for grouping.

For more detailed information, you can review the official Next.js documentation on [Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups).

