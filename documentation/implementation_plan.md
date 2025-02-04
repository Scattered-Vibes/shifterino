# Updated Actionable Items List
_Last Updated: March 2025_

This document outlines the current status, progress, and next steps for the 911 Dispatch Center Scheduling System project. The progress percentages and statuses have been updated based on our latest codebase review and integration tests with Next.js 14 (App Router), TypeScript, and Supabase (@supabase/ssr).

**Key:**

- **Status:**
  - `Not Started`
  - `In Progress`
  - `Blocked`
  - `Completed`
  - `Testing`
- **Progress:** Estimated percentage of completion
- **Priority:**
  - `High`
  - `Medium`
  - `Low`

---

## I. Authentication & Authorization

| Item                                                                   | Priority | Status      | Progress | Notes                                                                                                                                       |
| ---------------------------------------------------------------------- | -------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Implement User Login (email/password)                                  | High     | Completed   | 100%     | Implemented using Supabase Auth.                                                                                                            |
| Implement User Signup                                                  | High     | Completed   | 100%     | Implemented using Supabase Auth.                                                                                                            |
| Implement Email Confirmation                                            | High     | Completed   | 100%     | Implemented using Supabase Auth.                                                                                                            |
| Implement Password Reset                                                | Medium   | Not Started | 0%       | Supabase Auth supports this. UI and workflow need to be designed.                                                                           |
| Implement Logout                                                        | High     | Completed   | 100%     | Implemented using Supabase Auth.                                                                                                            |
| Implement Role-Based Access Control (Dispatcher, Supervisor, Manager)   | High     | In Progress | 75%      | Roles are created in the database and basic RLS policies are in place. Additional granular checks are on track.                              |
| Implement Session Management (Refresh, Expiration)                      | High     | In Progress | 70%      | Refresh-session API is implemented; further testing and edge-case management are underway.                                                  |
| Implement "Complete Profile" Page                                       | High     | Completed   | 100%     | Basic functionality is working. Additional UI polish and enhanced validation to follow.                                                     |
| Redirect to "Complete Profile" on First Login                           | High     | Completed   | 100%     | Redirect logic is implemented to notify users missing required profile details.                                                           |
| Implement Secure Password Storage (hashing)                             | High     | Completed   | 100%     | Handled natively by Supabase Auth.                                                                                                          |
| Implement OAuth (Social Logins) - (Future Feature)                      | Low      | Not Started | 0%       | Planned as a future feature; UI and integration will be required.                                                                          |
| Implement Auth Callback Route                                           | High     | Completed   | 100%     | Callback logic for OAuth and similar flows is in place.                                                                                    |
| Secure API Endpoints                                                    | High     | In Progress | 50%      | Current API endpoints have basic security; further testing and more granular implementations are pending.                                   |
| Implement Rate Limiting for Login Attempts                              | Medium   | Not Started | 0%       | To be implemented to mitigate brute-force attacks.                                                                                        |

---

## II. Profile Management

| Item                                           | Priority | Status      | Progress | Notes                                                                                                                  |
| ---------------------------------------------- | -------- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Allow Users to View Their Profile              | High     | Completed   | 100%     | Basic profile information is displayed on the dashboard.                                                             |
| Allow Users to Update Their Profile (Name, etc.) | Medium   | In Progress | 40%      | UI for editing and backend logic for updating the `employees` table are being iterated upon.                           |
| Validate Profile Updates                       | Medium   | Not Started | 0%       | Validation rules (e.g., name and email formats) need to be defined and integrated.                                     |
| Allow Managers to View/Edit All Profiles       | High     | In Progress | 20%      | Managers can view employee profiles; editing UI and robust role-based checks are under development.                    |

---

## III. Scheduling

| Item                                                                                | Priority | Status      | Progress | Notes                                                                                                                                       |
| ----------------------------------------------------------------------------------- | -------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Implement Shift Display for Dispatchers                                             | High     | Not Started | 0%       | A dedicated UI to clearly display assigned shifts needs to be created.                                                                     |
| Implement Shift Swap Requests (Dispatcher)                                          | High     | Not Started | 0%       | Both UI and backend logic are required for submitting, viewing, and managing swap requests.                                                  |
| Implement Shift Swap Approval/Rejection (Supervisor)                                | High     | Not Started | 0%       | Supervisor UI and backend approval/rejection logic remain to be implemented.                                                                |
| Implement Manual Shift Assignment (Supervisor)                                      | High     | In Progress | 40%      | The `ScheduleManager` component exists; requires further refinement to handle conflict checks and assignment logic.                         |
| Implement Shift Editing (Supervisor)                                                | High     | Not Started | 0%       | UI and backend logic for modifying shift details have not been started.                                                                    |
| Implement Shift Cancellation (Supervisor)                                           | Medium   | Not Started | 0%       | Cancellation workflow needs both UI elements and backend function.                                                                         |
| Implement Staffing Level Overview (Supervisor)                                      | High     | Completed   | 100%     | The `StaffingOverview` component provides this functionality.                                                                             |
| Implement Automatic Shift Flagging (Understaffed)                                   | High     | Not Started | 0%       | Backend logic to automatically flag underscheduled shifts based on staffing requirements is pending.                                        |
| Implement Supervisor Shift Designation                                               | Medium   | In Progress | 20%      | The `is_supervisor_shift` field exists in the database; UI and additional checks are under development.                                       |
| Implement Shift Pattern Management (Manager)                                        | High     | Not Started | 0%       | Requires creation of UI and backend support for managing shift patterns.                                                                    |
| Implement Shift Option Management (Manager)                                         | High     | Not Started | 0%       | UI and logic to define/manage shift options (e.g., start/end times) remain to be built.                                                       |
| Implement Staffing Requirement Management (Manager)                                 | High     | Not Started | 0%       | Tools to define minimum staffing levels per time block must be implemented.                                                                 |
| Implement Schedule Period Management (Manager)                                      | Medium   | Not Started | 0%       | UI and backend support for creating/editing/activating schedule periods remain pending.                                                      |
| Implement Automatic Schedule Generation                                             | High     | Not Started | 0%       | A comprehensive scheduling algorithm is yet to be designed and integrated.                                                                   |
| Implement Validation for Shift Patterns (e.g., consecutive shifts, rest periods)      | High     | In Progress | 10%      | Initial version in `validate_shift_pattern` exists. Further integration and testing are required.                                             |
| Implement Weekly Hours Limit Validation                                             | High     | In Progress | 10%      | Basic validation logic exists; needs to be tied into overall scheduling actions.                                                           |
| Implement Overtime Management                                                       | Medium   | Not Started | 0%       | UI and backend features for tracking and approving overtime have not yet been implemented.                                                    |
| Implement Schedule Conflict Detection                                               | High     | In Progress | 5%       | The `detect_schedule_conflicts` function has been initiated; further integration is required.                                                  |
| Implement Supervisor Coverage Verification                                          | High     | Not Started | 0%       | Logic to ensure each time block includes at least one supervisor remains to be developed.                                                      |
| Implement Logging for Schedule Changes                                              | Medium   | In Progress | 65%      | Basic logging is in place using `log_schedule_changes_trigger` and `log_scheduling_event`; enhancements are ongoing.                             |

---

## IV. Time-Off Management

| Item                                                    | Priority | Status      | Progress | Notes                                                                                                      |
| ------------------------------------------------------- | -------- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| Implement Time-Off Request Submission (Dispatcher)      | High     | Not Started | 0%       | UI and backend logic to submit time-off requests need to be built.                                         |
| Implement Time-Off Request Status Tracking (Dispatcher) | High     | Not Started | 0%       | A UI to display the status of submitted time-off requests remains pending.                                  |
| Implement Time-Off Request Approval/Rejection (Supervisor) | High   | In Progress | 55%      | Basic UI in the `TimeOffRequests` component is in place; logic and notification improvements are under review. |
| Implement Notifications for Time-Off Requests           | Medium   | Not Started | 0%       | Email or in-app notification integration for time-off requests to be implemented.                            |
| Implement Time-Off Calendar View (Supervisor)           | Medium   | Not Started | 0%       | A calendar UI to display approved time-off remains to be created.                                            |
| Implement Overlap Prevention for Time-Off Requests       | High     | Not Started | 0%       | Backend logic to prevent overlapping requests for the same employee is pending.                              |
| Implement Time-Off Request Cancellation                  | Medium   | Not Started | 0%       | UI and backend capabilities to cancel pending requests need to be developed.                                 |

---

## V. Staff Management

| Item                                        | Priority | Status      | Progress | Notes                                                                                       |
| ------------------------------------------- | -------- | ----------- | -------- | ------------------------------------------------------------------------------------------ |
| Implement Employee Creation (Manager)       | High     | In Progress | 60%      | Basic form in `StaffList` exists; needs further validation and integration with auth.       |
| Implement Employee Editing (Manager)        | High     | Not Started | 0%       | UI and backend logic to edit employee information remain pending.                          |
| Implement Employee Deactivation (Manager)   | Medium   | Not Started | 0%       | Functionality to deactivate employee accounts has not yet been developed.                   |
| Implement Shift Pattern Assignment (Manager) | Medium   | Not Started | 0%       | Integration with shift pattern management systems is still required.                        |
| Implement Weekly Hours Cap Setting (Manager) | Medium   | Not Started | 0%       | UI integration with employee profiles for weekly cap adjustments is pending.                |
| Implement Employee Statistics Reporting     | Medium   | In Progress | 20%      | The materialized view `mv_schedule_statistics` exists; UI for data display is in early stages. |

---

## VI. Reporting & Analytics

| Item                                                 | Priority | Status      | Progress | Notes                                                                                |
| ---------------------------------------------------  | -------- | ----------- | -------- | -----------------------------------------------------------------------------------  |
| Implement Staffing Level Reports                     | Medium   | Not Started | 0%       | Backend logic and UI to generate staffing level reports are pending.                |
| Implement Time-Off Usage Reports                     | Medium   | Not Started | 0%       | Requires UI and backend components for aggregating and displaying data.             |
| Implement Data Export Functionality (CSV, PDF)        | Low      | Not Started | 0%       | Functionality for exporting various reports is yet to be started.                     |
| Implement KPI Dashboard for Managers                  | Low      | Not Started | 0%       | Dashboard UI and backend logic for key performance indicators remain under planning.  |
| Implement Shift Statistics Report (e.g., hours, etc.) | Medium   | In Progress | 20%      | Building on the existing `mv_schedule_statistics` view; UI components are in development. |

---

## VII. System Administration

| Item                                                 | Priority | Status      | Progress | Notes                                                                   |
| ---------------------------------------------------- | -------- | ----------- | -------- | ----------------------------------------------------------------------  |
| Implement System Settings Configuration (Manager)    | Low      | Not Started | 0%       | UI for configuration and corresponding backend endpoints need to be created. |
| Implement System Logs Viewing (Manager)              | Low      | Not Started | 0%       | A UI to display system logs (errors, scheduling actions, etc.) is pending.      |
| Implement Automated Data Backup                      | High     | Not Started | 0%       | Establishing a regular backup process with Supabase is still to be addressed.   |
| Implement Email/Notification System                  | Medium   | Not Started | 0%       | Integration with an email service for notifications is planned for a future phase. |

---

## VIII. General Improvements

| Item                          | Priority | Status      | Progress | Notes                                                                                           |
| ----------------------------- | -------- | ----------- | -------- | ----------------------------------------------------------------------------------------------- |
| Improve UI/UX                 | Medium   | In Progress | 40%      | Ongoing enhancements. Shadcn UI provides a solid base; further refinements are planned.          |
| Implement Comprehensive Testing | High   | In Progress | 20%      | Unit, integration, and end-to-end tests are being added to improve coverage.                   |
| Optimize Database Queries     | Medium   | In Progress | 30%      | Some indexes have been added; further optimizations based on profiling are required.            |
| Improve Error Handling        | High     | In Progress | 40%      | Basic error handling is in place; more detailed messages and user feedback must be integrated.  |
| Improve Accessibility         | Medium   | Not Started | 0%       | Ensuring compliance with accessibility standards (WCAG) is yet to be undertaken.               |
| Code Refactoring              | Medium   | In Progress | 30%      | Ongoing efforts to enhance code quality and maintainability.                                   |
| Enhance Security              | High     | In Progress | 60%      | Continued hardening using Supabase Auth features and planned security audits.                  |
| Documentation                 | High     | In Progress | 50%      | README, status updates, and detailed technical docs remain a work in progress.                 |

---

## IX. Immediate Focus (Next Steps)

1. **High Priority - Authentication & Authorization:**
   - Finalize Role-Based Access Control with granular checks across all pages and API endpoints.
   - Complete comprehensive testing for session management (refresh and expiration scenarios).

2. **High Priority - Scheduling:**
   - Develop the UI for managing shift swap requests (for both Dispatchers and Supervisors).
   - Integrate enhanced shift pattern and weekly hours validations into the shift assignment process.
   - Build preliminary backend logic to flag understaffed shifts automatically.

3. **High Priority - Time-Off Management:**
   - Create the UI for submitting and viewing time-off requests for Dispatchers.

4. **High Priority - Profile Management:**
   - Enhance the UI to allow users to update their profiles.
   - Develop tools for Managers to view and edit all employee profiles effectively.

---

This roadmap breaks down larger items into manageable tasks and reflects our current progress. Continued iteration, integration, and testing will be key to achieving full functionality across all modules.
