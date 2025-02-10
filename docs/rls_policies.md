# Row Level Security (RLS) Policies

This document outlines the Row Level Security (RLS) policies implemented in the database to ensure proper data access control.

## Role Hierarchy

1. **Dispatcher (base role)**
   - Can view and manage their own data
   - Can update their own shift actual times
   - Can manage their own time-off requests
   - Can view reference data (shift options, staffing requirements)

2. **Supervisor**
   - All dispatcher permissions
   - Can view and manage team member data
   - Can approve/reject team time-off requests
   - Can view and update team shifts
   - Can view team schedules and logs

3. **Manager**
   - Full access to all data (except system settings)
   - Can perform all operations
   - Cannot access service-role-only tables

## Helper Functions

### `is_manager()`
- Checks if the current user has manager role
- Used in policies that require manager-level access
```sql
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE auth_id = auth.uid()
    AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `is_supervisor_or_above()`
- Checks if the current user has supervisor or manager role
- Used in policies that allow supervisor access
```sql
CREATE OR REPLACE FUNCTION public.is_supervisor_or_above()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE auth_id = auth.uid()
    AND role IN ('supervisor', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `get_team_members()`
- Returns the IDs of employees in the current user's team
- Used for supervisor access to team data
```sql
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (employee_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id FROM public.employees e
  WHERE EXISTS (
    SELECT 1 FROM public.employees supervisor
    WHERE supervisor.auth_id = auth.uid()
    AND supervisor.role IN ('supervisor', 'manager')
    AND e.team_id = supervisor.team_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `is_development()`
- Checks if the current environment is development
- Used to control access to test data
```sql
CREATE OR REPLACE FUNCTION public.is_development()
RETURNS boolean AS $$
BEGIN
  RETURN current_setting('app.settings.environment', true) = 'development';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Table Policies

### Employees Table

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| employees_select_own | SELECT | Users can view their own record | auth_id = auth.uid() |
| employees_select_supervisor | SELECT | Supervisors can view team members | is_supervisor_or_above() AND id IN (SELECT employee_id FROM public.get_team_members()) |
| employees_all_manager | ALL | Managers have full access | is_manager() |

### Profiles Table

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| profiles_select_own | SELECT | Users can view their own profile | user_id = auth.uid() |
| profiles_update_own | UPDATE | Users can update their own profile | user_id = auth.uid() |
| profiles_select_supervisor | SELECT | Supervisors can view team profiles | is_supervisor_or_above() AND user_id IN (...) |
| profiles_all_manager | ALL | Managers have full access | is_manager() |

### Individual Shifts Table

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| shifts_select_own | SELECT | Users can view their own shifts | employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid()) |
| shifts_update_own | UPDATE | Users can update actual times | employee_id IN (...) AND only actual times changed |
| shifts_select_supervisor | SELECT | Supervisors can view team shifts | is_supervisor_or_above() AND employee_id IN (...) |
| shifts_update_supervisor | UPDATE | Supervisors can update team shifts | is_supervisor_or_above() AND employee_id IN (...) |
| shifts_all_manager | ALL | Managers have full access | is_manager() |

### Time Off Requests Table

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| time_off_select_own | SELECT | Users can view their requests | employee_id IN (...) |
| time_off_insert_own | INSERT | Users can create requests | employee_id IN (...) |
| time_off_update_own | UPDATE | Users can update pending requests | employee_id IN (...) AND status = 'pending' |
| time_off_delete_own | DELETE | Users can delete pending requests | employee_id IN (...) AND status = 'pending' |
| time_off_select_supervisor | SELECT | Supervisors can view team requests | is_supervisor_or_above() AND employee_id IN (...) |
| time_off_update_supervisor | UPDATE | Supervisors can approve/reject | is_supervisor_or_above() AND only status changed |
| time_off_all_manager | ALL | Managers have full access | is_manager() |

### Shift Options Table (Reference Data)

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| shift_options_read_authenticated | SELECT | All users can read | true |
| shift_options_all_manager | ALL | Managers have full access | is_manager() |

### Staffing Requirements Table

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| staffing_requirements_read_authenticated | SELECT | All users can read | true |
| staffing_requirements_all_manager | ALL | Managers have full access | is_manager() |

### Schedule Periods Table

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| schedule_periods_read_authenticated | SELECT | All users can read | true |
| schedule_periods_all_manager | ALL | Managers have full access | is_manager() |

### Schedules Table

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| schedules_select_own | SELECT | Users can view own schedules | employee_id IN (...) |
| schedules_select_supervisor | SELECT | Supervisors can view team schedules | is_supervisor_or_above() AND employee_id IN (...) |
| schedules_all_manager | ALL | Managers have full access | is_manager() |

### Scheduling Logs Table (Audit Trail)

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| scheduling_logs_select_own | SELECT | Users can view own logs | employee_id IN (...) |
| scheduling_logs_select_supervisor | SELECT | Supervisors can view team logs | is_supervisor_or_above() AND employee_id IN (...) |
| scheduling_logs_insert_authenticated | INSERT | All users can create logs | true |
| scheduling_logs_all_manager | ALL | Managers have full access | is_manager() |

### Shift Assignment Scores Table

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| shift_scores_select_supervisor | SELECT | Supervisors can view team scores | is_supervisor_or_above() AND employee_id IN (...) |
| shift_scores_all_manager | ALL | Managers have full access | is_manager() |

### System Settings Table

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| system_settings_service_role | ALL | Service role only access | false |

### Test Data Table

| Policy Name | Operation | Description | USING Expression |
|------------|-----------|-------------|------------------|
| test_data_restricted | ALL | Restricted in production | false |
| test_data_development | ALL | Development access only | is_development() |

## Audit Logging

The system automatically logs sensitive operations using triggers. The following operations are logged:

1. Employee Changes
   - Creation
   - Role changes
   - Deletion

2. Schedule Changes
   - Creation
   - Status changes
   - Assignment changes
   - Deletion

3. Staffing Requirement Changes
   - Creation
   - Modification
   - Deletion

Logs include:
- Operation type (INSERT/UPDATE/DELETE)
- Table name
- Record ID
- Employee ID (where applicable)
- Old data (for updates/deletes)
- New data (for inserts/updates)
- User who made the change
- Timestamp

## Testing

RLS policies are tested using pgTAP in two files:
1. `supabase/tests/database/03_rls_policies.test.sql` - Core tables
2. `supabase/tests/database/04_rls_policies_phase2.test.sql` - Additional tables

The tests cover:
1. Role-based access control
2. Team-based access restrictions
3. Operation-specific permissions
4. Status-based restrictions
5. Field-level update restrictions
6. Audit logging functionality
7. Environment-specific access (development vs production)

Run tests using:
```bash
supabase test db
``` 