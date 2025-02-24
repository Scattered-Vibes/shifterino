-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all ENUM types first
CREATE TYPE shift_assignment_status AS ENUM ('ASSIGNED', 'SWAPPED', 'CANCELLED');
CREATE TYPE shift_task_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE');
CREATE TYPE employee_role AS ENUM ('manager', 'supervisor', 'dispatcher');
CREATE TYPE shift_pattern AS ENUM ('4x10', '3x12_plus_4');
CREATE TYPE day_of_week AS ENUM (
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
);
CREATE TYPE time_off_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE shift_swap_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE notification_type AS ENUM (
    'SHIFT_ASSIGNED',
    'SHIFT_CHANGED',
    'TIME_OFF_REQUESTED',
    'TIME_OFF_APPROVED',
    'TIME_OFF_REJECTED',
    'MESSAGE_RECEIVED',
    'SYSTEM_ALERT',
    'SHIFT_SWAP_REQUESTED',
    'SHIFT_SWAP_APPROVED',
    'SHIFT_SWAP_REJECTED',
    'MINIMUM_STAFFING_ALERT',
    'SUPERVISOR_REQUIRED_ALERT'
);
CREATE TYPE shift_category AS ENUM ('early', 'day', 'swing', 'graveyard');
CREATE TYPE shift_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE holiday_type AS ENUM ('FEDERAL', 'COMPANY', 'OTHER');
CREATE TYPE schedule_status AS ENUM ('draft', 'published', 'archived');

-- Create utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create conversion functions
CREATE OR REPLACE FUNCTION int_to_day_of_week(day_num INTEGER) 
RETURNS day_of_week AS $$
BEGIN
    RETURN CASE day_num
        WHEN 0 THEN 'SUNDAY'::day_of_week
        WHEN 1 THEN 'MONDAY'::day_of_week
        WHEN 2 THEN 'TUESDAY'::day_of_week
        WHEN 3 THEN 'WEDNESDAY'::day_of_week
        WHEN 4 THEN 'THURSDAY'::day_of_week
        WHEN 5 THEN 'FRIDAY'::day_of_week
        WHEN 6 THEN 'SATURDAY'::day_of_week
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION day_of_week_to_int(day day_of_week) 
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE day
        WHEN 'SUNDAY' THEN 0
        WHEN 'MONDAY' THEN 1
        WHEN 'TUESDAY' THEN 2
        WHEN 'WEDNESDAY' THEN 3
        WHEN 'THURSDAY' THEN 4
        WHEN 'FRIDAY' THEN 5
        WHEN 'SATURDAY' THEN 6
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE; 