-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;

-- Recreate the trigger
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
