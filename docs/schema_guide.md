# Supabase Database Schema Report

This document provides an exhaustive report on the current Supabase database schema as of 2025 for the 911 Dispatch Center Scheduling System. It details all tables, their columns (with data types), and descriptive comments for each field.

---

## Tables Overview

### 1. auth_logs
- **id (uuid)**  
  *Primary key. Unique identifier for each log entry.*
- **timestamp (timestamptz)**  
  *The moment the log was recorded.*
- **operation (text)**  
  *Describes the operation being logged (e.g., signup_start, signup_success, or signup_error).*
- **user_id (uuid)**  
  *References the user associated with this log entry.*
- **details (jsonb)**  
  *Holds additional event context and metadata in JSON format.*
- **error_message (text)**  
  *Contains error details if the operation encountered an issue.*

### 2. staffing_requirements
- **id (uuid)**  
  *Primary key.*
- **name (text)**  
  *Label for the staffing requirement definition.*
- **time_block_start (time)**  
  *Start time of the staffing period (e.g., 5:00 AM).*
- **time_block_end (time)**  
  *End time of the staffing period (e.g., 9:00 AM).*
- **min_total_staff (integer)**  
  *Minimum total number of employees required during the period.*
- **min_supervisors (integer)**  
  *Minimum number of supervisors required.*
- **schedule_period_id (uuid)**  
  *Foreign key linking this requirement to a specific schedule period.*
- **is_holiday (boolean)**  
  *Denotes if the requirement applies on holidays.*
- **override_reason (text)**  
  *Optional explanation when a requirement is manually overridden.*
- **created_at (timestamptz)**  
  *Timestamp when the record was created.*
- **updated_at (timestamptz)**  
  *Timestamp when the record was last updated.*

### 3. shift_pattern_rules
- **id (uuid)**  
  *Primary key.*
- **pattern (shift_pattern)**  
  *Defines the shift pattern type (e.g., pattern_a for four consecutive 10‑hour shifts, pattern_b for three 12‑hour shifts plus one 4‑hour shift).*
- **consecutive_shifts (integer)**  
  *The number of consecutive shifts allowed or expected.*
- **shift_durations (integer[])**  
  *An array specifying allowed shift duration options within the pattern.*
- **min_rest_hours (integer)**  
  *Minimum required rest period (in hours) between shifts (typically ≥8 hours).*
- **created_at (timestamptz)**  
  *Record creation timestamp.*
- **updated_at (timestamptz)**  
  *Timestamp of the most recent update.*

### 4. shift_swap_requests
- **id (uuid)**  
  *Primary key.*
- **requester_id (uuid)**  
  *ID of the employee requesting the shift swap.*
- **requested_employee_id (uuid)**  
  *ID of the employee being asked to switch shifts.*
- **shift_id (uuid)**  
  *Foreign key referencing the original shift.*
- **proposed_shift_id (uuid)**  
  *Optional reference to the alternate shift proposed.*
- **status (text)**  
  *Current status (e.g., pending, approved, denied).*
- **notes (text)**  
  *Additional comments regarding the swap request.*
- **created_at (timestamptz)**  
  *Timestamp when the request was submitted.*
- **updated_at (timestamptz)**  
  *Timestamp of the latest update.*

### 5. system_settings
- **id (uuid)**  
  *Primary key.*
- **setting_key (text)**  
  *Unique key identifying this setting.*
- **setting_value (text)**  
  *The stored value for the setting.*
- **description (text)**  
  *A description outlining the purpose of the setting.*
- **is_encrypted (boolean)**  
  *Indicates if the setting's value is stored in an encrypted form.*
- **created_at (timestamptz)**  
  *Creation timestamp.*
- **updated_at (timestamptz)**  
  *Last update timestamp.*

### 6. scheduling_logs
- **id (uuid)**  
  *Primary key.*
- **schedule_period_id (uuid)**  
  *Foreign key linking the log to a specific scheduling period.*
- **timestamp (timestamptz)**  
  *When the log event was recorded.*
- **log_message (text)**  
  *Descriptive message detailing the log event.*
- **severity (log_severity)**  
  *Indicates the log level (e.g., info, warning, error).*
- **related_employee_id (uuid)**  
  *Optional foreign key to an employee involved in the event.*
- **created_by (uuid)**  
  *ID of the user who created the log entry.*
- **created_at (timestamptz)**  
  *Timestamp for when the log was created.*

### 7. individual_shifts
- **id (uuid)**  
  *Primary key.*
- **employee_id (uuid)**  
  *References the employee assigned to the shift.*
- **shift_option_id (uuid)**  
  *Foreign key linking to the shift option that defines the timing and duration.*
- **schedule_period_id (uuid)**  
  *Associates the shift with a particular scheduling period.*
- **date (date)**  
  *The scheduled date of the shift.*
- **status (shift_status)**  
  *Current status (e.g., scheduled, completed, canceled).*
- **is_overtime (boolean)**  
  *Flags whether the shift counts as overtime.*
- **actual_start_time (time)**  
  *The actual clock-in time (if recorded).*
- **actual_end_time (time)**  
  *The actual clock-out time (if recorded).*
- **break_start_time (time)**  
  *Start time for any scheduled breaks.*
- **break_end_time (time)**  
  *End time for the break period.*
- **break_duration_minutes (integer)**  
  *Duration of the break in minutes.*
- **actual_hours_worked (integer)**  
  *Total hours recorded for the shift.*
- **notes (text)**  
  *General notes concerning the shift.*
- **schedule_conflict_note (text)**  
  *Details about any scheduling conflicts that occurred.*
- **is_regular_schedule (boolean)**  
  *Indicates if the shift follows the regular schedule pattern.*
- **supervisor_approved (uuid)**  
  *References the supervisor who approved the shift, if applicable.*
- **shift_score (integer)**  
  *A performance or quality score assigned to the shift.*
- **fatigue_level (integer)**  
  *Numeric indicator of the employee's fatigue during the shift.*
- **created_at (timestamptz)**  
  *When the shift record was created.*
- **updated_at (timestamptz)**  
  *When the shift record was last updated.*

### 8. shift_options
- **id (uuid)**  
  *Primary key.*
- **name (text)**  
  *A descriptive name for the shift (e.g., "Day Shift Early").*
- **start_time (time)**  
  *The scheduled start time for the shift option.*
- **end_time (time)**  
  *The scheduled end time for the shift option.*
- **duration_hours (integer)**  
  *The total duration in hours (restricted to 4, 10, or 12 hours).*
- **category (shift_category)**  
  *Classifies the type of shift (e.g., day, swing, graveyard).*
- **created_at (timestamptz)**  
  *Timestamp when the record was created.*
- **updated_at (timestamptz)**  
  *Timestamp when the record was last updated.*

### 9. schedule_periods
- **id (uuid)**  
  *Primary key.*
- **start_date (date)**  
  *Start date of the scheduling period.*
- **end_date (date)**  
  *End date of the scheduling period.*
- **description (text)**  
  *Optional description with additional details about the period.*
- **is_active (boolean)**  
  *Marks whether the schedule period is currently active.*
- **created_at (timestamptz)**  
  *When the scheduling period was created.*
- **updated_at (timestamptz)**  
  *When the scheduling period was last updated.*

### 10. schedules
- **id (uuid)**  
  *Primary key.*
- **created_at (timestamptz)**  
  *Timestamp when the schedule was created.*
- **updated_at (timestamptz)**  
  *Timestamp for the most recent update.*
- **start_date (date)**  
  *Start date for this schedule.*
- **end_date (date)**  
  *End date for the schedule.*
- **employee_id (uuid)**  
  *References the employee who is scheduled.*
- **shift_type (text)**  
  *Defines the type of shift (e.g., day_early, day, swing, graveyard).*
- **shift_pattern (shift_pattern)**  
  *Indicates the designated shift pattern for the employee (e.g., pattern_a or pattern_b).*
- **is_supervisor (boolean)**  
  *Indicates if the shift includes a supervisory role.*
- **status (text)**  
  *Current status of the schedule (e.g., draft, published, archived).*
- **created_by (uuid)**  
  *ID of the user who created the schedule.*
- **updated_by (uuid)**  
  *ID of the user who last updated the schedule.*

### 11. profiles
- **id (uuid)**  
  *Primary key.*
- **email (text)**  
  *Email address of the user.*
- **role (text)**  
  *User role (dispatcher, supervisor, or manager).*
- **is_email_verified (boolean)**  
  *Boolean flag indicating if the email has been verified.*
- **created_at (timestamptz)**  
  *Timestamp when the profile was created.*
- **updated_at (timestamptz)**  
  *Timestamp when the profile was last updated.*

### 12. employees
- **id (uuid)**  
  *Primary key.*
- **auth_id (uuid)**  
  *Foreign key referencing the associated auth user in `auth.users`.*
- **first_name (text)**  
  *Employee's first name.*
- **last_name (text)**  
  *Employee's last name.*
- **email (text)**  
  *Employee's email address.*
- **role (employee_role)**  
  *Employee role designation (dispatcher, supervisor, or manager).*
- **shift_pattern (shift_pattern)**  
  *Assigned shift pattern (e.g., pattern_a or pattern_b).*
- **preferred_shift_category (shift_category)**  
  *Employee's preferred type of shift (day, swing, or graveyard).*
- **weekly_hours_cap (integer)**  
  *Maximum regular working hours per week.*
- **max_overtime_hours (integer)**  
  *Maximum overtime hours allowed before requiring managerial override.*
- **last_shift_date (date)**  
  *The date of the most recent shift worked.*
- **total_hours_current (integer)**  
  *Aggregate hours worked in the current scheduling period.*
- **consecutive_shifts_count (integer)**  
  *Number of consecutive shifts worked.*
- **created_by (uuid)**  
  *User ID for who created the employee record.*
- **created_at (timestamptz)**  
  *Creation timestamp.*
- **updated_at (timestamptz)**  
  *Last update timestamp.*
- **weekly_hours (integer)**  
  *Standard scheduled hours per week (defaults to 40).*

### 13. time_off_requests
- **id (uuid)**  
  *Primary key.*
- **employee_id (uuid)**  
  *References the employee requesting time off.*
- **start_date (date)**  
  *Start date of the requested time off period.*
- **end_date (date)**  
  *End date of the requested time off period.*
- **status (time_off_status)**  
  *Current status (e.g., pending, approved, denied).*
- **notes (text)**  
  *Additional remarks regarding the request.*
- **reason (text)**  
  *Rationale behind the time-off request.*
- **created_at (timestamptz)**  
  *Timestamp when the request was created.*
- **updated_at (timestamptz)**  
  *Timestamp when the request was last updated.*

### 14. shift_assignment_scores
- **id (uuid)**  
  *Primary key.*
- **employee_id (uuid)**  
  *References the employee whose performance is being evaluated.*
- **shift_id (uuid)**  
  *Foreign key linking to the specific shift.*
- **schedule_period_id (uuid)**  
  *Associates the score with a scheduling period.*
- **preference_score (integer)**  
  *Score reflecting the alignment with employee shift preferences.*
- **fatigue_score (integer)**  
  *Indicator of shift-related fatigue.*
- **fairness_score (integer)**  
  *Score to assess fairness in shift distribution.*
- **total_score (integer)**  
  *Aggregate score based on various factors.*
- **created_at (timestamptz)**  
  *Timestamp when the score was recorded.*

---

## Relationships & Additional Notes

- **User-Employee Link:**  
  The `employees` table references `auth.users` via the `auth_id` field, ensuring each employee is linked to an authenticated user.

- **Scheduling Association:**  
  Tables such as `individual_shifts`, `schedules`, and `staffing_requirements` use foreign keys (like `schedule_period_id`) to link records to specific scheduling periods.

- **Audit and Logging:**  
  Both `auth_logs` and `scheduling_logs` maintain audit trails for user-related events and scheduling operations, respectively.

- **Data Integrity:**  
  Constraints and check conditions (e.g., valid break times, acceptable shift durations) are enforced at the database level to ensure data accuracy and consistency.

---

## Conclusion

This exhaustive schema report documents every table within our Supabase database—from authentication logs and employee data to detailed scheduling and shift management tables. The described columns, data types, and inline comments are designed to support robust 24/7 scheduling and secure operational workflows for the 911 Dispatch Center. This schema, along with the defined relationships and constraints, underpins our strategy for real-time data management and role-based access control.

*Last Updated: 2025*

