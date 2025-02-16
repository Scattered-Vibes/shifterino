-- Fix incorrect employee roles and shift patterns
-- This migration corrects data issues introduced by previous incorrect seeding.

-- Update the role column, casting the existing text values to the correct enum type.
-- The 'USING' clause handles the implicit type conversion, and the CASE statement
-- provides a fallback to 'dispatcher' if an invalid value is encountered.
UPDATE public.employees
SET role = CASE
    WHEN role = 'manager' THEN 'manager'::public.employee_role
    WHEN role = 'supervisor' THEN 'supervisor'::public.employee_role
    WHEN role = 'dispatcher' THEN 'dispatcher'::public.employee_role
    ELSE 'dispatcher'::public.employee_role -- Default to dispatcher for safety
  END
WHERE role::text IN ('manager', 'supervisor', 'dispatcher');

-- Update the shift_pattern column, casting the existing text values to the correct enum.
UPDATE public.employees
SET shift_pattern = CASE
    WHEN shift_pattern = '4x10' THEN 'pattern_a'::public.shift_pattern
    WHEN shift_pattern = '3x12_plus_4' THEN 'pattern_b'::public.shift_pattern
    ELSE 'pattern_a'::public.shift_pattern -- Default to pattern_a
  END
WHERE shift_pattern::text IN ('4x10', '3x12_plus_4', 'custom'); --include custom
