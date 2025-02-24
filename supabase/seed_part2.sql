-- seed_part2.sql
-- Set up user relationships and initial data after user creation

-- Initialize time-off balances for all employees
INSERT INTO public.time_off_balances (
    id,
    user_id,
    balance_type,
    hours_available,
    hours_used,
    last_accrual_date,
    next_accrual_date
)
SELECT 
    uuid_generate_v4(),
    e.id,
    'vacation'::time_off_type,
    80, -- Initial vacation balance (80 hours)
    0,  -- No hours used yet
    NOW(),
    NOW() + INTERVAL '1 month'
FROM public.employees e
ON CONFLICT (user_id, balance_type) DO NOTHING;

INSERT INTO public.time_off_balances (
    id,
    user_id,
    balance_type,
    hours_available,
    hours_used,
    last_accrual_date,
    next_accrual_date
)
SELECT 
    uuid_generate_v4(),
    e.id,
    'sick'::time_off_type,
    40, -- Initial sick leave balance (40 hours)
    0,  -- No hours used yet
    NOW(),
    NOW() + INTERVAL '1 month'
FROM public.employees e
ON CONFLICT (user_id, balance_type) DO NOTHING;

-- Create initial welcome notifications for all employees
INSERT INTO public.notifications (
    id,
    user_id,
    type,
    title,
    content,
    is_read
)
SELECT 
    uuid_generate_v4(),
    e.id,
    'system'::notification_type,
    'Welcome to the Scheduling System',
    'Welcome to the 911 Dispatch Center scheduling system. Please review your assigned shifts and update your availability.',
    false
FROM public.employees e
ON CONFLICT DO NOTHING;

-- Create initial system settings if not exists
INSERT INTO public.system_settings (
    id,
    setting_key,
    setting_value,
    description
)
VALUES
    (
        uuid_generate_v4(),
        'min_hours_notice_timeoff',
        '{"value": 72, "unit": "hours"}'::jsonb,
        'Minimum notice required for time-off requests'
    ),
    (
        uuid_generate_v4(),
        'max_consecutive_shifts',
        '{"value": 5, "unit": "shifts"}'::jsonb,
        'Maximum number of consecutive shifts allowed'
    ),
    (
        uuid_generate_v4(),
        'auto_approve_swap_rules',
        '{
            "same_role": true,
            "same_shift_length": true,
            "max_hours_difference": 2
        }'::jsonb,
        'Rules for automatic shift swap approval'
    )
ON CONFLICT (setting_key) DO NOTHING;

-- Create audit log entry for initial setup
INSERT INTO public.audit_logs (
    id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    performed_by,
    performed_at
)
SELECT
    uuid_generate_v4(),
    'SYSTEM_INIT',
    'system',
    NULL,
    NULL,
    jsonb_build_object(
        'message', 'Initial system setup completed',
        'timestamp', NOW()::text,
        'setup_by', e.id
    ),
    e.id,
    NOW()
FROM public.employees e
WHERE e.role = 'manager'
LIMIT 1; 