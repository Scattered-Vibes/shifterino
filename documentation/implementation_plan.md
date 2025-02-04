Updated actionable items list with estimated progress and status indicated.

**Note:**  The progress estimations are based on the code and documentation provided. Since I don't have access to a live development environment, testing results, or a task tracking system, these are educated guesses.

**Actionable Items List**

**Key:**

*   **Status:**
    *   `Not Started`
    *   `In Progress`
    *   `Blocked`
    *   `Completed`
    *   `Testing`
*   **Progress:** Estimated percentage of completion
*   **Priority:**
    *   `High`
    *   `Medium`
    *   `Low`

**I. Authentication & Authorization**

| Item                                                                       | Priority | Status        | Progress | Notes                                                                                                                                      |
| :------------------------------------------------------------------------- | :------- | :------------ | :------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| Implement User Login (email/password)                                     | High     | Completed     | 100%     | Implemented using Supabase Auth.                                                                                                         |
| Implement User Signup                                                     | High     | Completed     | 100%     | Implemented using Supabase Auth.                                                                                                         |
| Implement Email Confirmation                                               | High     | Completed     | 100%     | Implemented using Supabase Auth.                                                                                                         |
| Implement Password Reset                                                   | Medium   | Not Started   | 0%       | Supabase Auth supports this, needs UI and workflow.                                                                                      |
| Implement Logout                                                           | High     | Completed     | 100%     | Implemented using Supabase Auth.                                                                                                         |
| Implement Role-Based Access Control (Dispatcher, Supervisor, Manager)      | High     | In Progress   | 75%      | Roles are created in database. RLS policies implemented. Dashboard, employees, and manage pages have basic checks. Need more granular control. |
| Implement Session Management (Refresh, Expiration)                          | High     | In Progress   | 60%      | Implemented refresh-session API.  Needs more testing and refinement for edge cases.                                                     |
| Implement "Complete Profile" Page                                          | High     | Completed     | 100%     | Basic functionality working, needs more validation and UI polish.                                                                         |
| Redirect to "Complete Profile" on First Login                             | High     | Completed     | 100%     | Implemented, redirects to the complete-profile page if employee record is missing.                                                       |
| Implement Secure Password Storage (hashing)                                | High     | Completed     | 100%     | Handled by Supabase Auth.                                                                                                               |
| Implement OAuth (Social Logins) - (Future Feature)                        | Low      | Not Started   | 0%       | Future feature. Supabase Auth supports this, needs UI and integration.                                                                   |
| Implement Auth Callback Route                                             | High     | Completed     | 100%     | Implemented.                                                                                                                            |
| Secure API Endpoints                                                       | High     | In Progress   | 50%      | Some API endpoints are secured. More comprehensive testing and implementation for all endpoints needed.                                |
| Implement rate limiting for login attempts                                  | Medium   | Not Started   | 0%       | Need to implement rate limiting to prevent brute-force attacks.                                                                     |

**II. Profile Management**

| Item                                           | Priority | Status        | Progress | Notes                                                                                                              |
| :--------------------------------------------- | :------- | :------------ | :------- | :----------------------------------------------------------------------------------------------------------------- |
| Allow Users to View Their Profile              | High     | Completed     | 100%     | Basic information displayed on the dashboard.                                                                       |
| Allow Users to Update Their Profile (Name, etc.) | Medium   | In Progress   | 30%      | Need UI for profile editing, and backend logic to update `employees` table.                                        |
| Validate Profile Updates                       | Medium   | Not Started   | 0%       | Need to add validation rules for profile updates (e.g., name format, email format).                               |
| Allow Managers to View/Edit All Profiles       | High     | In Progress   | 20%      | Managers can view all employees in the employees and manage pages. Need UI for editing and proper role-based checks. |

**III. Scheduling**

| Item                                                                                | Priority | Status        | Progress | Notes                                                                                                                                       |
| :---------------------------------------------------------------------------------- | :------- | :------------ | :------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| Implement Shift Display for Dispatchers                                             | High     | Not Started   | 0%       | Need to create a dedicated UI to display assigned shifts clearly.                                                                         |
| Implement Shift Swap Requests (Dispatcher)                                        | High     | Not Started   | 0%       | Need UI and backend logic for submitting, viewing, and managing swap requests.                                                              |
| Implement Shift Swap Approval/Rejection (Supervisor)                               | High     | Not Started   | 0%       | Need UI and backend logic for supervisors to approve/reject swap requests.                                                               |
| Implement Manual Shift Assignment (Supervisor)                                      | High     | In Progress   | 40%      | `ScheduleManager` component exists. Needs refinement for assigning shifts, and conflict checks.                                              |
| Implement Shift Editing (Supervisor)                                                | High     | Not Started   | 0%       | Need UI and backend logic for editing shift details.                                                                                     |
| Implement Shift Cancellation (Supervisor)                                           | Medium   | Not Started   | 0%       | Need UI and backend logic for cancelling shifts.                                                                                         |
| Implement Staffing Level Overview (Supervisor)                                     | High     | Completed     | 100%      | `StaffingOverview` component provides this.                                                                                              |
| Implement Automatic Shift Flagging (Understaffed)                                 | High     | Not Started   | 0%       | Need backend logic to identify understaffed shifts based on `staffing_requirements`.                                                      |
| Implement Supervisor Shift Designation                                              | Medium   | In Progress  | 20% | `is_supervisor_shift` field exists in the database. Needs UI for designation and logic for ensuring supervisor coverage. |
| Implement Shift Pattern Management (Manager)                                       | High     | Not Started   | 0%       | Need UI and backend logic for creating, editing, and assigning shift patterns.                                                           |
| Implement Shift Option Management (Manager)                                        | High     | Not Started   | 0%       | Need UI and backend logic for defining and managing shift options (start/end times, categories).                                           |
| Implement Staffing Requirement Management (Manager)                                | High     | Not Started   | 0%       | Need UI and backend logic for defining minimum staffing levels per time block.                                                          |
| Implement Schedule Period Management (Manager)                                      | Medium   | Not Started   | 0%       | Need UI and backend logic for creating, editing, and activating schedule periods.                                                        |
| Implement Automatic Schedule Generation                                               | High     | Not Started   | 0%       | This is a complex feature. Requires careful planning and implementation of the scheduling algorithm.                                    |
| Implement Validation for Shift Patterns (e.g., consecutive shifts, rest periods)   | High     | In Progress   | 10%      | Basic validation exists in `validate_shift_pattern` function. Needs to be integrated into scheduling actions.                           |
| Implement Weekly Hours Limit Validation                                            | High     | In Progress   | 10%      | Basic validation in `validate_shift_pattern` function, needs integration into scheduling actions.                                           |
| Implement Overtime Management                                                      | Medium   | Not Started   | 0%       | Need UI and backend logic for tracking and approving overtime.                                                                           |
| Implement Schedule Conflict Detection                                              | High     | In Progress   | 5%       | `detect_schedule_conflicts` function exists, but needs integration into shift creation/editing.                                         |
| Implement Supervisor Coverage Verification                                          | High     | Not Started   | 0%       | Need logic to ensure at least one supervisor is scheduled for each time block.                                                         |
| Implement Logging for Schedule Changes                                               | Medium   | In Progress   | 60%      | Basic logging implemented with `log_schedule_changes_trigger` and `log_scheduling_event` function.                                     |

**IV. Time-Off Management**

| Item                                                    | Priority | Status        | Progress | Notes                                                                                                      |
| :------------------------------------------------------ | :------- | :------------ | :------- | :--------------------------------------------------------------------------------------------------------- |
| Implement Time-Off Request Submission (Dispatcher)      | High     | Not Started   | 0%       | Need UI and backend logic for submitting time-off requests.                                                 |
| Implement Time-Off Request Status Tracking (Dispatcher) | High     | Not Started   | 0%       | Need UI to display the status of submitted time-off requests.                                              |
| Implement Time-Off Request Approval/Rejection (Supervisor) | High     | In Progress   | 50%      | Basic UI in `TimeOffRequests` component.  Needs more robust logic and notifications.                       |
| Implement Notifications for Time-Off Requests           | Medium   | Not Started   | 0%       | Need to implement email or in-app notifications for new and updated time-off requests.                    |
| Implement Time-Off Calendar View (Supervisor)           | Medium   | Not Started   | 0%       | Need UI to display approved time-off requests in a calendar format.                                      |
| Implement Overlap Prevention for Time-Off Requests      | High     | Not Started   | 0%       | Need backend logic to prevent overlapping time-off requests for the same employee.                         |
| Implement Time-Off Request Cancellation                 | Medium   | Not Started   | 0%       | Need UI and backend logic to allow cancellation of pending time-off requests by the requester or supervisor. |

**V. Staff Management**

| Item                                        | Priority | Status        | Progress | Notes                                                                                       |
| :------------------------------------------ | :------- | :------------ | :------- | :------------------------------------------------------------------------------------------ |
| Implement Employee Creation (Manager)       | High     | In Progress   | 60%      | Basic form in `StaffList` component. Needs proper validation and integration with auth. |
| Implement Employee Editing (Manager)        | High     | Not Started   | 0%       | Need UI and backend logic for editing employee information.                                  |
| Implement Employee Deactivation (Manager)   | Medium   | Not Started   | 0%       | Need UI and backend logic for deactivating employee accounts.                             |
| Implement Shift Pattern Assignment (Manager) | Medium   | Not Started   | 0%       | Need UI and integration with shift pattern management.                                    |
| Implement Weekly Hours Cap Setting (Manager) | Medium   | Not Started   | 0%       | Need UI and integration with employee profiles.                                           |
| Implement Employee Statistics Reporting     | Medium   | In Progress   | 20%      | `mv_schedule_statistics` materialized view exists. Need UI to display and filter data.   |

**VI. Reporting & Analytics**

| Item                                                 | Priority | Status        | Progress | Notes                                                                                |
| :--------------------------------------------------- | :------- | :------------ | :------- | :----------------------------------------------------------------------------------- |
| Implement Staffing Level Reports                     | Medium   | Not Started   | 0%       | Need UI and backend logic to generate reports on staffing levels over time.         |
| Implement Time-Off Usage Reports                     | Medium   | Not Started   | 0%       | Need UI and backend logic to generate reports on time-off usage.                    |
| Implement Data Export Functionality (CSV, PDF)        | Low      | Not Started   | 0%       | Need to implement data export functionality for various reports.                   |
| Implement KPI Dashboard for Managers                  | Low      | Not Started   | 0%       | Need UI and backend logic to display key performance indicators on a dashboard. |
| Implement Shift Statistics Report (e.g., hours, etc.) | Medium   | In Progress   | 20%      | `mv_schedule_statistics` materialized view exists. Needs UI for report generation. |

**VII. System Administration**

| Item                                                 | Priority | Status      | Progress | Notes                                                                   |
| :--------------------------------------------------- | :------- | :---------- | :------- | :---------------------------------------------------------------------- |
| Implement System Settings Configuration (Manager)     | Low      | Not Started | 0%       | Need UI and backend logic for managing system settings.                  |
| Implement System Logs Viewing (Manager)               | Low      | Not Started | 0%       | Need UI to display system logs (scheduling actions, errors, etc.).     |
| Implement Automated Data Backup                      | High     | Not Started | 0%       | Need to set up a mechanism for regular database backups (Supabase has this). |
| Implement Email/Notification System                  | Medium   | Not Started | 0%       | Need to integrate an email service for sending notifications.           |

**VIII. General Improvements**

| Item                          | Priority | Status        | Progress | Notes                                                                                                      |
| :---------------------------- | :------- | :------------ | :------- | :--------------------------------------------------------------------------------------------------------- |
| Improve UI/UX                 | Medium   | In Progress   | 40%      | Ongoing effort. Shadcn UI provides a good foundation.                                                    |
| Implement Comprehensive Testing | High     | In Progress   | 20%      | Need to add unit tests, integration tests, and end-to-end tests.                                        |
| Optimize Database Queries     | Medium   | In Progress   | 30%      | Some indexes added. Further optimization needed based on usage patterns.                                |
| Improve Error Handling        | High     | In Progress   | 40%      | Basic error handling in place. Need more specific error messages and user feedback.                      |
| Improve Accessibility         | Medium   | Not Started   | 0%       | Need to ensure the app meets accessibility standards (WCAG).                                             |
| Code Refactoring              | Medium   | In Progress   | 30%      | Ongoing effort to improve code quality and maintainability.                                                |
| Enhance Security              | High     | In Progress   | 60%      | Ongoing effort.  Leveraging Supabase Auth features. Further hardening and security audits are recommended. |
| Documentation                 | High     | In Progress   | 50%      | README and STATUS in progress, need more detailed documentation.                                            |

**IX. Immediate Focus (Next Steps)**

1.  **High Priority - Authentication & Authorization:**
    *   Complete Role-Based Access Control (RBAC) implementation. Granular checks on all relevant pages and API endpoints.
    *   Thoroughly test session management, including refresh and expiration scenarios.

2.  **High Priority - Scheduling:**
    *   Implement the UI for viewing and managing shift swap requests. (Dispatcher and Supervisor)
    *   Integrate shift pattern and weekly hour validation into the shift assignment process.
    *   Implement automatic shift flagging for understaffed shifts.

3.  **High Priority - Time Off:**
    *   Implement the UI for submitting and viewing time-off requests. (Dispatcher)

4. **High Priority - Profile Management:**
    *    Implement UI for users to update their own profiles.
    *    Implement UI for managers to edit all profiles.

This detailed breakdown gives you a roadmap for development. Remember to break down these larger items into smaller, manageable tasks within your team's workflow. Good luck!
