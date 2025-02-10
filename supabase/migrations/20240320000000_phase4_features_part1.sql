-- Add overtime tracking columns to individual_shifts
ALTER TABLE individual_shifts
ADD COLUMN IF NOT EXISTS requested_overtime boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS overtime_approved_by uuid REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS overtime_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS overtime_hours numeric(4,2);

-- Create type for swap request status if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'swap_request_status') THEN
        CREATE TYPE swap_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
    END IF;
END $$;

-- Add new columns to existing shift_swap_requests table
ALTER TABLE shift_swap_requests
ADD COLUMN IF NOT EXISTS requested_at timestamptz NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_individual_shifts_overtime 
ON individual_shifts (requested_overtime) 
WHERE requested_overtime = true;

CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_status 
ON shift_swap_requests (status) 
WHERE status = 'PENDING'; 