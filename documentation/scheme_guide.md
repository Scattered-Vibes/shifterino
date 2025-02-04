**Database Tables and Columns**

**1. `employees`**

| Column Name                | Data Type            | Constraints                                    | Description                                                                                                                                           |
| :------------------------- | :------------------- | :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                       | `UUID`               | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`     | Unique identifier for each employee (auto-generated).                                                                                                 |
| `auth_id`                  | `UUID`               | `NOT NULL`, `REFERENCES auth.users(id)`     | Foreign key referencing the `auth.users` table, linking the employee record to the authentication system.                                             |
| `first_name`               | `TEXT`               | `NOT NULL`                                     | Employee's first name.                                                                                                                               |
| `last_name`                | `TEXT`               | `NOT NULL`                                     | Employee's last name.                                                                                                                                |
| `email`                    | `TEXT`               | `NOT NULL`, `UNIQUE`                          | Employee's email address (must be unique).                                                                                                        |
| `role`                     | `employee_role`      | `NOT NULL`                                     | Employee's role (e.g., 'dispatcher', 'supervisor', 'manager'). Defined by the `employee_role` enum type.                                              |
| `shift_pattern`            | `shift_pattern`      | `NOT NULL`                                     | Employee's assigned shift pattern (e.g., 'pattern_a', 'pattern_b'). Defined by the `shift_pattern` enum type.                                          |
| `preferred_shift_category` | `shift_category`     |                                                | Employee's preferred shift category (e.g., 'early', 'day', 'swing', 'graveyard'). Defined by the `shift_category` enum type.                      |
| `weekly_hours_cap`         | `INTEGER`            | `NOT NULL`, `DEFAULT 40`                       | The maximum number of hours an employee can be scheduled per week.                                                                                |
| `max_overtime_hours`       | `INTEGER`            | `DEFAULT 0`                                    | The maximum number of overtime hours an employee is allowed to work.                                                                               |
| `last_shift_date`          | `DATE`               |                                                | The date of the employee's last completed shift.                                                                                                    |
| `total_hours_current_week` | `INTEGER`            | `DEFAULT 0`                                    | The total number of hours the employee has worked in the current week.                                                                                 |
| `consecutive_shifts_count` | `INTEGER`            | `DEFAULT 0`                                    | The number of consecutive shifts the employee has worked.                                                                                             |
| `created_by`               | `UUID`               | `REFERENCES auth.users(id)`                   | The user who created the employee record.                                                                                                           |
| `created_at`               | `TIMESTAMPTZ`        | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`        | Timestamp indicating when the employee record was created.                                                                                           |
| `updated_at`               | `TIMESTAMPTZ`        | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`        | Timestamp indicating when the employee record was last updated.                                                                                       |

**Purpose:** Stores information about each employee, including their personal details, role, shift preferences, and scheduling-related data.

**2. `profiles`**

| Column Name          | Data Type     | Constraints                                    | Description                                                                                |
| :------------------- | :------------ | :--------------------------------------------- | :----------------------------------------------------------------------------------------- |
| `id`                 | `UUID`        | `PRIMARY KEY`, `REFERENCES auth.users(id)`     | Unique identifier, foreign key referencing `auth.users` table.                           |
| `email`              | `TEXT`        | `NOT NULL`, `UNIQUE`                          | User's email address (must be unique).                                                     |
| `role`               | `TEXT`        | `NOT NULL`                                     | User's role (mirroring `employees.role` but as plain text for simplicity in this table). |
| `is_email_verified`  | `BOOLEAN`     | `DEFAULT FALSE`                                | Indicates whether the user's email has been verified.                                     |
| `created_at`         | `TIMESTAMPTZ` | `DEFAULT NOW()`                               | Timestamp indicating when the profile was created.                                        |
| `updated_at`         | `TIMESTAMPTZ` | `DEFAULT NOW()`                               | Timestamp indicating when the profile was last updated.                                   |

**Purpose:** Stores basic profile information linked to the `auth.users` table, used primarily for managing user accounts and basic profile data.

**3. `shift_options`**

| Column Name      | Data Type     | Constraints                               | Description                                                                         |
| :--------------- | :------------ | :---------------------------------------- | :---------------------------------------------------------------------------------- |
| `id`             | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for each shift option.                                            |
| `name`           | `TEXT`        | `NOT NULL`                                | Name or description of the shift option (e.g., "Early 4hr", "Day 10hr").           |
| `start_time`     | `TIME`        | `NOT NULL`                                | Start time of the shift.                                                            |
| `end_time`       | `TIME`        | `NOT NULL`                                | End time of the shift.                                                              |
| `duration_hours` | `INTEGER`     | `NOT NULL`                                | Duration of the shift in hours.                                                     |
| `category`       | `shift_category` | `NOT NULL`                                | Category of the shift (e.g., 'early', 'day', 'swing', 'graveyard').                 |
| `created_at`     | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`   | Timestamp indicating when the shift option was created.                             |
| `updated_at`     | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`   | Timestamp indicating when the shift option was last updated.                        |

**Purpose:** Defines the different types of shifts available for scheduling (e.g., "Morning Shift," "Afternoon Shift").

**4. `staffing_requirements`**

| Column Name          | Data Type     | Constraints                               | Description                                                                                                |
| :------------------- | :------------ | :---------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `id`                 | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for each staffing requirement record.                                                   |
| `name`               | `TEXT`        | `NOT NULL`                                | Name or description of the staffing requirement.                                                          |
| `time_block_start`   | `TIME`        | `NOT NULL`                                | Start time of the time block for which this staffing requirement applies.                                 |
| `time_block_end`     | `TIME`        | `NOT NULL`                                | End time of the time block for which this staffing requirement applies.                                   |
| `min_total_staff`    | `INTEGER`     | `NOT NULL`                                | Minimum number of total staff required during this time block.                                            |
| `min_supervisors`    | `INTEGER`     | `NOT NULL`, `DEFAULT 1`                  | Minimum number of supervisors required during this time block.                                             |
| `schedule_period_id` | `UUID`        | `REFERENCES schedule_periods(id)`        | Optional foreign key to a specific schedule period. If NULL, the requirement is considered a default.     |
| `is_holiday`         | `BOOLEAN`     | `DEFAULT FALSE`                           | Indicates whether this requirement applies to holidays.                                                    |
| `override_reason`    | `TEXT`        |                                           | Optional reason for overriding default staffing requirements.                                              |
| `created_at`         | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`   | Timestamp indicating when the staffing requirement record was created.                                     |
| `updated_at`         | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`   | Timestamp indicating when the staffing requirement record was last updated.                                |

**Purpose:** Defines the minimum staffing levels required for different time blocks throughout the day.

**5. `shift_pattern_rules`**

| Column Name            | Data Type       | Constraints                               | Description                                                                                        |
| :--------------------- | :-------------- | :---------------------------------------- | :------------------------------------------------------------------------------------------------- |
| `id`                   | `UUID`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for each shift pattern rule.                                                     |
| `pattern`              | `shift_pattern` | `NOT NULL`                                | The shift pattern this rule applies to (e.g., 'pattern_a', 'pattern_b').                           |
| `consecutive_shifts`   | `INTEGER`       | `NOT NULL`                                | The maximum number of consecutive shifts allowed for this pattern.                                  |
| `shift_durations`      | `INTEGER[]`     | `NOT NULL`                                | An array of allowed shift durations (in hours) for this pattern.                                   |
| `min_rest_hours`       | `INTEGER`       | `NOT NULL`, `DEFAULT 10`                  | The minimum number of rest hours required between shifts in this pattern.                           |
| `created_at`           | `TIMESTAMPTZ`   | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`   | Timestamp indicating when the shift pattern rule was created.                                      |
| `updated_at`           | `TIMESTAMPTZ`   | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`   | Timestamp indicating when the shift pattern rule was last updated.                                 |

**Purpose:** Defines the rules for each supported shift pattern (e.g., Pattern A: 4 consecutive 10-hour shifts).

**6. `schedule_periods`**

| Column Name      | Data Type     | Constraints                               | Description                                                                                |
| :--------------- | :------------ | :---------------------------------------- | :----------------------------------------------------------------------------------------- |
| `id`             | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for each schedule period.                                                 |
| `start_date`     | `DATE`        | `NOT NULL`                                | Start date of the schedule period.                                                         |
| `end_date`       | `DATE`        | `NOT NULL`                                | End date of the schedule period.                                                           |
| `description`    | `TEXT`        |                                           | Optional description of the schedule period.                                                |
| `is_active`      | `BOOLEAN`     | `DEFAULT TRUE`                            | Indicates whether this schedule period is currently active.                                 |
| `created_at`     | `TIMESTAMPTZ` | `DEFAULT NOW()`                            | Timestamp indicating when the schedule period was created.                                  |
| `updated_at`     | `TIMESTAMPTZ` | `DEFAULT NOW()`                            | Timestamp indicating when the schedule period was last updated.                            |

**Purpose:** Defines the time periods for which schedules are generated (e.g., weekly, bi-weekly).

**7. `individual_shifts`**

| Column Name                | Data Type        | Constraints                                                          | Description                                                                                                                  |
| :------------------------- | :--------------- | :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| `id`                       | `UUID`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                            | Unique identifier for each individual shift.                                                                                  |
| `employee_id`              | `UUID`           | `NOT NULL`, `REFERENCES employees(id)`                              | Foreign key referencing the `employees` table, indicating the employee assigned to the shift.                              |
| `shift_option_id`          | `UUID`           | `NOT NULL`, `REFERENCES shift_options(id)`                          | Foreign key referencing the `shift_options` table, indicating the type of shift.                                               |
| `schedule_period_id`       | `UUID`           | `REFERENCES schedule_periods(id)`                                   | Foreign key referencing the `schedule_periods` table, indicating the schedule period this shift belongs to.                   |
| `date`                     | `DATE`           | `NOT NULL`                                                            | Date of the shift.                                                                                                           |
| `status`                   | `shift_status`   | `NOT NULL`, `DEFAULT 'scheduled'`                                   | Status of the shift (e.g., 'scheduled', 'in_progress', 'completed', 'missed', 'cancelled').                                |
| `is_overtime`              | `BOOLEAN`        | `NOT NULL`, `DEFAULT FALSE`                                          | Indicates whether the shift is considered overtime.                                                                          |
| `actual_start_time`        | `TIMESTAMPTZ`    |                                                                       | Actual start time of the shift, if different from the scheduled start time.                                                    |
| `actual_end_time`          | `TIMESTAMPTZ`    |                                                                       | Actual end time of the shift, if different from the scheduled end time.                                                      |
| `break_start_time`         | `TIMESTAMPTZ`    |                                                                       | Start time of the employee's break during the shift.                                                                         |
| `break_end_time`           | `TIMESTAMPTZ`    |                                                                       | End time of the employee's break during the shift.                                                                           |
| `break_duration_minutes`   | `INTEGER`        |                                                                       | Duration of the break in minutes.                                                                                            |
| `actual_hours_worked`      | `DECIMAL(5,2)`   |                                                                       | Actual number of hours worked during the shift.                                                                                |
| `notes`                    | `TEXT`           |                                                                       | Any notes related to the shift.                                                                                              |
| `schedule_conflict_notes`  | `TEXT`           |                                                                       | Notes about any detected scheduling conflicts for this shift.                                                               |
| `is_regular_schedule`      | `BOOLEAN`        | `NOT NULL`, `DEFAULT TRUE`                                          | Indicates whether this shift is part of the employee's regular schedule or an ad-hoc assignment.                            |
| `supervisor_approved_by`   | `UUID`           | `REFERENCES employees(id)`                                          | If applicable, the ID of the supervisor who approved changes or exceptions related to this shift.                            |
| `supervisor_approved_at`   | `TIMESTAMPTZ`    |                                                                       | Timestamp indicating when the supervisor approval was given.                                                                  |
| `shift_score`              | `INTEGER`        |                                                                       | A score representing the desirability or suitability of the shift assignment, based on factors like employee preferences, etc. |
| `fatigue_level`            | `INTEGER`        |                                                                       | A score representing the potential fatigue level associated with the shift, considering factors like consecutive shifts.     |
| `created_at`               | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                               | Timestamp indicating when the shift record was created.                                                                       |
| `updated_at`               | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                               | Timestamp indicating when the shift record was last updated.                                                                  |

**Purpose:** Stores information about each individual shift assigned to an employee.

**8. `time_off_requests`**

| Column Name      | Data Type        | Constraints                                    | Description                                                                     |
| :--------------- | :--------------- | :--------------------------------------------- | :------------------------------------------------------------------------------ |
| `id`             | `UUID`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`     | Unique identifier for each time-off request.                                    |
| `employee_id`    | `UUID`           | `NOT NULL`, `REFERENCES employees(id)`         | Foreign key referencing the `employees` table.                                  |
| `start_date`     | `DATE`           | `NOT NULL`                                     | Start date of the requested time off.                                            |
| `end_date`       | `DATE`           | `NOT NULL`                                     | End date of the requested time off.                                              |
| `status`         | `time_off_status` | `NOT NULL`, `DEFAULT 'pending'`               | Status of the request ('pending', 'approved', 'rejected').                     |
| `notes`          | `TEXT`           |                                                | Any notes related to the time-off request.                                     |
| `created_at`     | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`        | Timestamp indicating when the time-off request was created.                    |
| `updated_at`     | `TIMESTAMPTZ`    | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`        | Timestamp indicating when the time-off request was last updated.                 |

**Purpose:** Stores time-off requests submitted by employees.

**9. `shift_swap_requests`**

| Column Name             | Data Type        | Constraints                                                          | Description                                                                                               |
| :---------------------- | :--------------- | :------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `id`                    | `UUID`           | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                          | Unique identifier for each shift swap request.                                                             |
| `requester_id`          | `UUID`           | `NOT NULL`, `REFERENCES employees(id)`                            | Foreign key referencing the `employees` table, indicating the employee who initiated the swap request.      |
| `requested_employee_id` | `UUID`           | `NOT NULL`, `REFERENCES employees(id)`                            | Foreign key referencing the `employees` table, indicating the employee being asked to swap shifts.       |
| `shift_id`              | `UUID`           | `NOT NULL`, `REFERENCES individual_shifts(id)`                      | Foreign key referencing the `individual_shifts` table, indicating the shift the requester wants to swap. |
| `proposed_shift_id`     | `UUID`           | `REFERENCES individual_shifts(id)`                                  | Foreign key referencing the `individual_shifts` table, indicating the shift offered in exchange (optional). |
| `status`                | `time_off_status` | `NOT NULL`, `DEFAULT 'pending'`                                      | Status of the swap request ('pending', 'approved', 'rejected').                                           |
| `notes`                 | `TEXT`           |                                                                       | Any notes related to the swap request.                                                                    |
| `created_at`            | `TIMESTAMPTZ`    | `DEFAULT NOW()`                                                      | Timestamp indicating when the swap request was created.                                                   |
| `updated_at`            | `TIMESTAMPTZ`    | `DEFAULT NOW()`                                                      | Timestamp indicating when the swap request was last updated.                                              |

**Purpose:** Stores shift swap requests initiated by employees.

**10. `scheduling_logs`**

| Column Name           | Data Type       | Constraints                                    | Description                                                                                                |
| :-------------------- | :-------------- | :--------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `id`                  | `UUID`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`     | Unique identifier for each log entry.                                                                       |
| `schedule_period_id`  | `UUID`          | `REFERENCES schedule_periods(id)`             | Foreign key referencing the `schedule_periods` table (if the log is related to a specific schedule period). |
| `timestamp`           | `TIMESTAMPTZ`   | `DEFAULT NOW()`                               | Timestamp indicating when the log entry was created.                                                       |
| `log_message`         | `TEXT`          | `NOT NULL`                                     | The log message describing the event.                                                                       |
| `severity`            | `log_severity`  | `NOT NULL`                                     | Severity level of the log entry ('info', 'warning', 'error').                                            |
| `related_employee_id` | `UUID`          | `REFERENCES employees(id)`                     | Optional foreign key referencing the `employees` table, if the log entry is related to a specific employee. |
| `created_by`          | `UUID`          | `REFERENCES profiles(id)`                   | The user who created this log entry.                                                                         |
| `created_at`          | `TIMESTAMPTZ`   | `DEFAULT NOW()`                               | Timestamp of when the log was created.                                                                      |

**Purpose:** Stores a log of important system events, such as scheduling actions, errors, and other notable occurrences.

**11. `shift_assignment_scores`**

| Column Name           | Data Type     | Constraints                                                          | Description                                                                                                    |
| :-------------------- | :------------ | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| `id`                  | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                            | Unique identifier for each score record.                                                                       |
| `employee_id`         | `UUID`        | `NOT NULL`, `REFERENCES employees(id)`                              | Foreign key referencing the `employees` table.                                                                 |
| `shift_id`            | `UUID`        | `NOT NULL`, `REFERENCES individual_shifts(id)`                      | Foreign key referencing the `individual_shifts` table.                                                        |
| `schedule_period_id`  | `UUID`        | `NOT NULL`, `REFERENCES schedule_periods(id)`                        | Foreign key referencing the `schedule_periods` table.                                                          |
| `preference_score`    | `INTEGER`     | `NOT NULL`                                                            | Score representing how well the shift assignment matches the employee's preferences.                          |
| `fatigue_score`       | `INTEGER`     | `NOT NULL`                                                            | Score representing the potential fatigue level associated with this shift assignment for the employee.        |
| `fairness_score`      | `INTEGER`     | `NOT NULL`                                                            | Score representing the overall fairness of the shift assignment, considering factors like workload distribution. |
| `total_score`         | `INTEGER`     | `NOT NULL`                                                            | The combined total score for the shift assignment.                                                            |
| `created_at`          | `TIMESTAMPTZ` | `DEFAULT NOW()`                                                      | Timestamp indicating when the score record was created.                                                        |

**Purpose:** Stores scores calculated for each shift assignment, used by the scheduling algorithm to optimize assignments.

**12. `system_settings`**

| Column Name      | Data Type     | Constraints                                   | Description                                                                                                               |
| :--------------- | :------------ | :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `id`             | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`    | Unique identifier for each system setting.                                                                                |
| `setting_key`    | `TEXT`        | `NOT NULL`, `UNIQUE`                         | Unique key identifying the setting (e.g., 'NOTIFICATION_EMAIL').                                                        |
| `setting_value`  | `TEXT`        | `NOT NULL`                                    | The value of the setting.                                                                                                 |
| `description`    | `TEXT`        |                                               | Optional description of the setting.                                                                                     |
| `is_encrypted`   | `BOOLEAN`     | `DEFAULT FALSE`                              | Indicates whether the setting value is encrypted (e.g., for sensitive data like API keys).                               |
| `created_at`     | `TIMESTAMPTZ` | `DEFAULT NOW()`                               | Timestamp indicating when the system setting was created.                                                                 |
| `updated_at`     | `TIMESTAMPTZ` | `DEFAULT NOW()`                               | Timestamp indicating when the system setting was last updated.                                                            |

**Purpose:** Stores system-wide settings and configuration options.

**Materialized View: `mv_schedule_statistics`**

| Column Name          | Data Type     | Description                                                                                                                  |
| :------------------- | :------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| `employee_id`        | `UUID`        | Employee's ID.                                                                                                               |
| `first_name`         | `TEXT`        | Employee's first name.                                                                                                       |
| `last_name`          | `TEXT`        | Employee's last name.                                                                                                        |
| `role`               | `employee_role` | Employee's role.                                                                                                             |
| `total_shifts`       | `BIGINT`      | Total number of shifts assigned to the employee.                                                                             |
| `avg_hours_per_shift` | `NUMERIC`     | Average hours worked per shift by the employee.                                                                              |
| `total_hours`        | `NUMERIC`     | Total hours worked by the employee across all shifts.                                                                        |
| `periods_worked`     | `BIGINT`      | Number of distinct schedule periods the employee has worked in.                                                              |
| `avg_score`          | `NUMERIC`     | Average total score of shift assignments for the employee, reflecting the quality and fairness of their assigned shifts. |

**Purpose:** This materialized view provides pre-calculated statistics related to employee scheduling, which can be used for reporting and analytics. It aggregates data from the `employees`, `individual_shifts`, and `shift_assignment_scores` tables. The `CONCURRENTLY` keyword in the refresh function allows for the view to be refreshed without locking the underlying tables, making it suitable for production environments.

**Views:**

*   **`v_current_schedule`:** Provides a view of the currently active schedule, joining `individual_shifts` with `employees` and `shift_options`.
*   **`v_staffing_levels`:** Provides a view of staffing levels for each time block, compared against the required staffing from `staffing_requirements`.

**Enum Types:**

*   **`employee_role`:**  `'dispatcher'`, `'supervisor'`, `'manager'`
*   **`shift_pattern`:** `'pattern_a'`, `'pattern_b'`, `'custom'`
*   **`shift_category`:** `'early'`, `'day'`, `'swing'`, `'graveyard'`
*   **`time_off_status`:** `'pending'`, `'approved'`, `'rejected'`
*   **`shift_status`:** `'scheduled'`, `'in_progress'`, `'completed'`, `'missed'`, `'cancelled'`
*   **`log_severity`:** `'info'`, `'warning'`, `'error'`

