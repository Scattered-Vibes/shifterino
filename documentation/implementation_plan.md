# Updated Actionable Items List


This document outlines the current status, progress, and next steps for the 911 Dispatch Center Scheduling System project. The progress percentages and statuses below reflect our latest codebase review and integration tests with Next.js 14 (App Router), TypeScript, and Supabase (@supabase/ssr). Updates have been incorporated based on ongoing development and feedback from recent integration tests.

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
| Implement Email Confirmation                                           | High     | Completed   | 100%     | Implemented using Supabase Auth.                                                                                                            |
| Implement Password Reset                                               | Medium   | Not Started | 0%       | Supabase Auth supports this. UI and workflow design are pending.                                                                            |
| Implement Logout                                                       | High     | Completed   | 100%     | Implemented using Supabase Auth.                                                                                                            |
| Implement Role-Based Access Control (Dispatcher, Supervisor, Manager)  | High     | In Progress | 75%      | Roles are set up with basic RLS policies. Next: complete granular checks and further integration tests.                                    |
| Implement Session Management (Refresh, Expiration)                     | High     | In Progress | 70%      | Refresh-session API in place. Next: finalize edge-case handling and complete integration with cookie/session management.                     |
| Implement "Complete Profile" Page                                      | High     | Completed   | 100%     | Basic functionality is working. Further UI polish and enhanced validation are planned.                                                     |
| Redirect to "Complete Profile" on First Login                          | High     | Completed   | 100%     | Redirect logic for mandatory profile details is implemented.                                                                              |
| Implement Secure Password Storage (hashing)                            | High     | Completed   | 100%     | Managed natively by Supabase Auth.                                                                                                          |
| Implement OAuth (Social Logins) - (Future Feature)                     | Low      | Not Started | 0%       | Planned for future integration; requires UI and proper setup.                                                                             |
| Implement Auth Callback Route                                          | High     | Completed   | 100%     | Callback logic for OAuth and similar workflows is in place.                                                                               |
| Secure API Endpoints                                                   | High     | In Progress | 50%      | Basic security implemented; further hardening and penetration testing are required.                                                       |
| Implement Rate Limiting for Login Attempts                             | Medium   | Not Started | 0%       | To be defined and integrated to mitigate brute-force attacks.                                                                             |

---

## II. Profile Management

| Item                                           | Priority | Status      | Progress | Notes                                                                                                                  |
| ---------------------------------------------- | -------- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Allow Users to View Their Profile              | High     | Completed   | 100%     | Basic profile information is displayed on the dashboard.                                                             |
| Allow Users to Update Their Profile (Name, etc.) | Medium   | In Progress | 40%–45%  | UI for editing and backend logic for updating the `employees` table are underway; further validation is needed.        |
| Validate Profile Updates                       | Medium   | Not Started | 0%       | Validation rules (name, email format, etc.) need to be defined and integrated.                                         |
| Allow Managers to View/Edit All Profiles       | High     | In Progress | 20%      | Managers can view employee profiles; editing UI and robust role-based permission checks remain under development.        |

---

## III. Scheduling

| Item                                                                                | Priority | Status      | Progress | Notes                                                                                                                                       |
| ----------------------------------------------------------------------------------- | -------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Implement Shift Display for Dispatchers                                             | High     | Not Started | 0%       | A dedicated UI to clearly display assigned shifts needs to be created.                                                                      |
| Implement Shift Swap Requests (Dispatcher)                                          | High     | Not Started | 0%       | UI components and backend endpoints for submitting, viewing, and managing swap requests are pending.                                        |
| Implement Shift Swap Approval/Rejection (Supervisor)                                | High     | Not Started | 0%       | Supervisor UI and backend approval/rejection workflow remain to be implemented.                                                              |
| Implement Manual Shift Assignment (Supervisor)                                      | High     | In Progress | 40%      | `ScheduleManager` component exists; further refinement of conflict checks and assignment logic is required.                                  |
| Implement Shift Editing (Supervisor)                                                | High     | Not Started | 0%       | UI and backend logic for modifying shift details have not been initiated.                                                                   |
| Implement Shift Cancellation (Supervisor)                                           | Medium   | Not Started | 0%       | Design of a cancellation workflow and corresponding UI elements is pending.                                                                 |
| Implement Staffing Level Overview (Supervisor)                                      | High     | Completed   | 100%     | The `StaffingOverview` component provides current functionality.                                                                           |
| Implement Automatic Shift Flagging (Understaffed)                                   | High     | Not Started | 0%       | Backend logic to automatically flag underscheduled shifts based on staffing requirements is pending.                                        |
| Implement Supervisor Shift Designation                                               | Medium   | In Progress | 20%      | The `is_supervisor_shift` field exists; UI and additional verification checks are under development.                                         |
| Implement Shift Pattern Management (Manager)                                        | High     | Not Started | 0%       | Requires creation of UI and backend support for managing and editing shift patterns.                                                        |
| Implement Shift Option Management (Manager)                                         | High     | Not Started | 0%       | UI and logic to define/manage shift options (e.g., start/end times) remain pending.                                                          |
| Implement Staffing Requirement Management (Manager)                                 | High     | Not Started | 0%       | Tools to define and manage minimum staffing levels per time block need to be developed.                                                      |
| Implement Schedule Period Management (Manager)                                      | Medium   | Not Started | 0%       | UI and backend support for creating, editing, and activating schedule periods remain pending.                                               |
| Implement Automatic Schedule Generation                                             | High     | Not Started | 0%       | A comprehensive scheduling algorithm is yet to be designed and integrated.                                                                  |
| Implement Validation for Shift Patterns (e.g., consecutive shifts, rest periods)      | High     | In Progress | 10%      | Initial version exists in `validate_shift_pattern`; further integration and testing are required.                                            |
| Implement Weekly Hours Limit Validation                                             | High     | In Progress | 10%      | Basic validation logic is in place; needs to be tied into overall scheduling actions.                                                        |
| Implement Overtime Management                                                       | Medium   | Not Started | 0%       | UI and backend features for tracking and approving overtime have not yet been implemented.                                                    |
| Implement Schedule Conflict Detection                                               | High     | In Progress | 5%       | The `detect_schedule_conflicts` function has been initiated; further integration is required.                                                 |
| Implement Supervisor Coverage Verification                                          | High     | Not Started | 0%       | Logic to ensure each time block includes at least one supervisor needs to be developed.                                                       |
| Implement Logging for Schedule Changes                                              | Medium   | In Progress | 65%      | Basic logging is in place (via `log_schedule_changes_trigger` and `log_scheduling_event`); further enhancements are planned.                   |

---

## IV. Time-Off Management

| Item                                                    | Priority | Status      | Progress | Notes                                                                                                      |
| ------------------------------------------------------- | -------- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| Implement Time-Off Request Submission (Dispatcher)      | High     | Not Started | 0%       | UI and backend logic for submitting time-off requests need to be built.                                   |
| Implement Time-Off Request Status Tracking (Dispatcher) | High     | Not Started | 0%       | A UI to display the status of submitted time-off requests remains pending.                                |
| Implement Time-Off Request Approval/Rejection (Supervisor) | High   | In Progress | 55%      | Basic UI in the `TimeOffRequests` component is in place; further refinement and notification improvements are underway. |
| Implement Notifications for Time-Off Requests           | Medium   | Not Started | 0%       | Email or in-app notification integration for time-off requests is planned.                                |
| Implement Time-Off Calendar View (Supervisor)           | Medium   | Not Started | 0%       | A calendar UI displaying approved time-off remains to be created.                                        |
| Implement Overlap Prevention for Time-Off Requests       | High     | Not Started | 0%       | Backend logic to prevent overlapping requests for the same employee is pending.                           |
| Implement Time-Off Request Cancellation                  | Medium   | Not Started | 0%       | UI and backend capabilities for cancelling pending requests need to be developed.                         |

---

## V. Staff Management

| Item                                        | Priority | Status      | Progress | Notes                                                                                       |
| ------------------------------------------- | -------- | ----------- | -------- | ------------------------------------------------------------------------------------------ |
| Implement Employee Creation (Manager)       | High     | In Progress | 60%      | Basic form in `StaffList` exists; further validation and integration with auth is ongoing.  |
| Implement Employee Editing (Manager)        | High     | Not Started | 0%       | UI and backend logic for editing employee information remain pending.                      |
| Implement Employee Deactivation (Manager)   | Medium   | Not Started | 0%       | Functionality to deactivate employee accounts has not yet been developed.                   |
| Implement Shift Pattern Assignment (Manager) | Medium   | Not Started | 0%       | Integration with shift pattern management systems is still required.                        |
| Implement Weekly Hours Cap Setting (Manager) | Medium   | Not Started | 0%       | UI integration for adjusting weekly hours within employee profiles is pending.              |
| Implement Employee Statistics Reporting     | Medium   | In Progress | 20%      | The materialized view `mv_schedule_statistics` exists; UI components to display statistics are in early stages. |

---

## VI. Reporting & Analytics

| Item                                                 | Priority | Status      | Progress | Notes                                                                                |
| ---------------------------------------------------  | -------- | ----------- | -------- | -----------------------------------------------------------------------------------  |
| Implement Staffing Level Reports                     | Medium   | Not Started | 0%       | Backend report generation and corresponding UI dashboard are pending.                |
| Implement Time-Off Usage Reports                     | Medium   | Not Started | 0%       | Requires design and development of aggregation components for data display.          |
| Implement Data Export Functionality (CSV, PDF)        | Low      | Not Started | 0%       | Outlining export functionality for various reports is forthcoming.                   |
| Implement KPI Dashboard for Managers                  | Low      | Not Started | 0%       | Dashboard UI and API endpoints for key performance indicators need to be planned.      |
| Implement Shift Statistics Report (e.g., hours, etc.) | Medium   | In Progress | 20%      | Building on the existing `mv_schedule_statistics` view; further UI development is underway. |

---

## VII. System Administration

| Item                                                 | Priority | Status      | Progress | Notes                                                                   |
| ---------------------------------------------------- | -------- | ----------- | -------- | ----------------------------------------------------------------------  |
| Implement System Settings Configuration (Manager)    | Low      | Not Started | 0%       | UI for configuration and corresponding API endpoints need to be built.  |
| Implement System Logs Viewing (Manager)              | Low      | Not Started | 0%       | A dashboard for viewing system logs (errors, scheduling actions, etc.) is pending. |
| Implement Automated Data Backup                      | High     | Not Started | 0%       | Strategy for regular backups using Supabase tools must be established.  |
| Implement Email/Notification System                  | Medium   | Not Started | 0%       | Integration with an email service for system notifications is planned.  |

---

## VIII. General Improvements

| Item                          | Priority | Status      | Progress | Notes                                                                                           |
| ----------------------------- | -------- | ----------- | -------- | ----------------------------------------------------------------------------------------------- |
| Improve UI/UX                 | Medium   | In Progress | 40%      | Ongoing enhancements; further UI refinements are planned in collaboration with the design team.    |
| Implement Comprehensive Testing | High   | In Progress | 20%      | Increasing test coverage (unit, integration, and end-to-end) remains a priority.                   |
| Optimize Database Queries     | Medium   | In Progress | 30%      | Some indexes are in place; further query profiling and optimization are required.                |
| Improve Error Handling        | High     | In Progress | 40%      | Basic error handling is implemented; enhancing detailed error messages and user feedback is next.  |
| Improve Accessibility         | Medium   | Not Started | 0%       | Initiate accessibility audits and update UI components to meet WCAG guidelines.                  |
| Code Refactoring              | Medium   | In Progress | 30%      | Ongoing refactoring efforts to improve code quality and maintainability.                         |
| Enhance Security              | High     | In Progress | 60%      | Continue security audits and implement planned hardening measures.                               |
| Documentation                 | High     | In Progress | 50%      | README and technical docs are being updated to reflect current changes and future plans.         |

---

## IX. Immediate Focus (Next Steps)

1. **High Priority - Authentication & Authorization:**
   - Finalize granular Role-Based Access Control and perform comprehensive session management testing.
   - Harden API endpoint security and implement rate limiting for login attempts.

2. **High Priority - Scheduling:**
   - Develop the UI for managing shift swap requests for both Dispatchers and Supervisors.
   - Integrate enhanced validations for shift patterns, weekly hours, and conflict detection.
   - Build initial backend logic to automatically flag understaffed shifts and verify supervisor coverage.

3. **High Priority - Time-Off Management:**
   - Create the UI for submitting and tracking time-off requests.
   - Refine the supervisor approval/rejection workflow and integrate notification capabilities.

4. **High Priority - Profile Management:**
   - Enhance the profile update interface with robust validation.
   - Develop tools for Managers to securely view and edit employee profiles with role-specific permissions.

---

This roadmap breaks down larger features into manageable tasks and sets clear priorities with measurable progress. Continued iteration, integration testing, and cross-team collaboration remain essential to advance functionality across all modules.

