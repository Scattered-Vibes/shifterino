# Supabase Database Overview

This document provides a comprehensive overview of the Supabase database used in the 911 Dispatch Center Scheduling System. It summarizes the architecture, core schemas, tables, functions, triggers, and security policies implemented across our migrations. Additionally, it includes key Supabase CLI commands for managing migrations and generating TypeScript types.

---

## 1. Database Architecture

- **Backend Engine:** PostgreSQL extended by Supabase.
- **Extensions:**
  - **pgcrypto:** For cryptographic functions and UUID generation.
  - **pgjwt:** For JWT token operations.
- **Schemas:**
  - **public:** Houses the bulk of application tables (employees, schedules, shifts, etc.).
  - **auth:** Contains authentication-related tables (users, sessions, refresh tokens, MFA claims, and secrets).

---

## 2. Migrations Overview

The database schema evolves through versioned migration files managed via the Supabase CLI. Key migrations include:

### Migration: 001_core_schema_and_auth.sql
- **Purpose:** Establish core authentication and user management.
- **Key Elements:**
  - Creation of extensions and schemas.
  - Definition of roles and enum types (e.g., `employee_role`, `shift_pattern`).
  - Tables such as `auth.users`, `public.profiles`, and `public.employees`.
  - Test helper functions and triggers to maintain audit fields.
  - Logging user signup events via the `public.auth_logs` table.

### Migration: 002_scheduling_schema.sql
- **Purpose:** Implement scheduling functionality for 24/7 coverage.
- **Key Elements:**
  - Core scheduling tables: `shift_options`, `staffing_requirements`, `shift_pattern_rules`, `schedule_periods`, `individual_shifts`, `time_off_requests`, `shift_swap_requests`.
  - A materialized view (`mv_schedule_statistics`) to aggregate scheduling statistics.
  - A dedicated `schedules` table with Row Level Security (RLS) policies, ensuring that:
    - Regular employees can view only their own schedules.
    - Supervisors have elevated access to manage schedules.
  - Additional indexes and constraints to enforce valid time ranges and staffing minimums.

### Migration: 003_auth_sessions_and_jwt.sql
- **Purpose:** Introduce robust session management and JWT configuration.
- **Key Elements:**
  - Creation of `auth.sessions` for managing active user sessions.
  - Tables for refresh tokens (`auth.refresh_tokens`) and MFA claims (`auth.mfa_amr_claims`).
  - Setup of JWT secret management via the `auth.secrets` table.
  - Definition of helper functions such as `auth.jwt()` and `auth.role()` to extract JWT claims and role information.

### Migration: 20250214_validate_session.sql
- **Purpose:** Validate active sessions efficiently.
- **Key Elements:**
  - A `public.validate_session` function that verifies session validity.
  - An index on `auth.sessions` for optimal session lookup performance.
  - RLS policy adjustments for session functions.

---

## 3. Core Tables and Entities

### Authentication & User Management
- **auth.users:** Stores core user data and credentials.
- **public.profiles:** Contains extended profile information.
- **public.employees:** Manages employee details including their roles, shift patterns, and scheduling constraints.

### Scheduling and Shift Management
- **public.shift_options:** Defines available shift types, their start/end times, duration, and category.
- **public.schedule_periods:** Represents periods over which schedules are planned.
- **public.individual_shifts:** Records the assignment of shifts to employees.
- **public.schedules:** Consolidates schedule information with strict RLS policies.

### Session and JWT Management
- **auth.sessions:** Maintains active user sessions.
- **auth.refresh_tokens:** Manages tokens for session refreshing.
- **auth.mfa_amr_claims:** Logs multifactor authentication claims.
- **auth.secrets:** Stores JWT secrets and related metadata.

### Employees
- Primary table for user data
- Contains employee information, roles, and shift pattern preferences
- Key constraints:
  - `auth_id` must be unique and reference `auth.users`
  - `weekly_hours_cap` must be between 0 and 168
  - `max_overtime_hours` must be between 0 and 40
  - `role` must be one of: dispatcher, supervisor, manager
  - `shift_pattern` must be one of: pattern_a, pattern_b, custom
- Indexes:
  - Primary key on `id`
  - Index on `(first_name, last_name)` for name searches
  - Index on `auth_id`

### Shift Options
- Reference data for available shift types
- Key constraints:
  - `name` must be unique within each `category`
  - `duration_hours` must match the time difference between `start_time` and `end_time`
  - `duration_hours` must be 4, 10, or 12
  - Valid times for shifts crossing midnight
- Indexes:
  - Primary key on `id`
  - Unique index on `(name, category)`

### Schedules
- Contains all shift assignments
- Key constraints:
  - No overlapping shifts for the same employee (using tstzrange)
  - Weekly hours must not exceed employee's cap unless overtime approved
  - Shift must match employee's pattern:
    - Pattern A: Four consecutive 10-hour shifts
    - Pattern B: Three consecutive 12-hour shifts plus one 4-hour shift
  - All critical fields (employee_id, shift_option_id, date, status) cannot be null
- Indexes:
  - Primary key on `id`
  - GiST index on employee_id and shift time range
  - Index on `(employee_id, date)`

### Time Off Requests
- Manages employee time off requests
- Key constraints:
  - No overlapping requests for the same employee
  - `end_date` must be >= `start_date`
  - All critical fields (employee_id, start_date, end_date, status) cannot be null
- Indexes:
  - Primary key on `id`
  - GiST index on employee_id and date range
  - Index on `(employee_id, start_date, end_date)`

### Staffing Requirements
- Defines minimum staffing levels for each time period
- Key constraints:
  - `min_total_staff` must be >= `min_supervisors`
  - `min_supervisors` must be >= 0
  - `min_total_staff` must be > 0
  - Valid time blocks for periods crossing midnight
- Indexes:
  - Primary key on `id`
  - Index on `schedule_period_id`

### Audit Logs
- Tracks all changes to sensitive data
- Key constraints:
  - All fields except `old_data` and `new_data` cannot be null
  - `changed_by` must reference `auth.users`
- Indexes:
  - Primary key on `id`
  - Index on `(table_name, record_id)`
  - Index on `changed_by`
  - Index on `changed_at DESC`

---

## 4. Functions, Triggers, and RLS Policies

### Functions & Triggers
- **Audit Triggers:** Automatically update `updated_at` fields on key tables.
- **Business Logic Functions:**  
  - `test_helpers.create_test_user()` assists in generating test users.
  - `public.handle_new_user()` manages new user signups and logging.
  - `public.validate_session()` enforces session validity.
- **JWT Helpers:**  
  - `auth.jwt()` returns JWT claims.
  - `auth.role()` extracts the role from JWT claims.

### Row Level Security (RLS)
- **RLS Policies on Sensitive Tables:**  
  - **Schedules:** Restricted so that normal users can only access their own schedules, while supervisors can access all.
  - **Sessions:** Policies ensure that users have access only to their own sessions.
- These policies are enforced by SQL-level checks and tailored triggers.

### Employees Table
- Dispatchers can only view their own record
- Supervisors can view team members
- Managers have full access

### Shift Options Table
- All authenticated users can read
- Only managers can modify

### Schedules Table
- Dispatchers can:
  - View own schedules
  - Update actual times and break times for own shifts
- Supervisors can:
  - View team schedules
  - Update team schedules
- Managers have full access

### Time Off Requests Table
- Dispatchers can:
  - View own requests
  - Create new requests
  - Update/delete pending requests
- Supervisors can:
  - View team requests
  - Approve/reject team requests
- Managers have full access

### Staffing Requirements Table
- All authenticated users can read
- Only managers can modify

### Audit Logs Table
- Dispatchers can view own records
- Supervisors can view team records
- Managers have full access

### Schedule Validation
- `check_weekly_hours()`: Ensures weekly hours don't exceed cap
- `check_consecutive_shifts()`: Validates shift pattern rules

### Helper Functions
- `is_manager()`: Checks if current user is manager
- `is_supervisor_or_above()`: Checks if current user is supervisor or manager
- `get_team_members()`: Gets list of employees in current user's team

---

## 5. Supabase CLI Usage

The Supabase CLI is integral for maintaining the database schema. Use the following commands as part of your development workflow:

- **Run Migrations:**
  ```bash
  npx supabase migration run
  ```

- **Generate Types:**
  Generate TypeScript types from your current schema after any changes:
  ```bash
  npx supabase gen types typescript --project-id your_project_id > types/supabase/database.ts
  ```

- **Perform Security and RLS Tests:**
  ```bash
  npx supabase test rls
  ```

- **Security Audit:**
  ```bash
  npx supabase-security-check
  ```

---

## 6. Conclusion

This document outlines the structure and evolution of our Supabase database, covering major migrations, core tables, functions, triggers, and security policies that support the robust requirements of our 911 Dispatch Center Scheduling System. The careful integration of authentication, real-time scheduling, and RLS ensures both high performance and stringent security standards.

For further details, refer to individual migration SQL files in the `supabase/migrations` directory and the additional documentation provided in the project repository.