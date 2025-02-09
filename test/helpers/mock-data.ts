export const mockEmployee = {
  id: '123',
  auth_id: 'auth_123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  role: 'dispatcher' as const,
  shift_pattern: 'pattern_a' as const,
  preferred_shift_category: 'day' as const,
} 