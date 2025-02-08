import { describe, it, expect } from 'vitest';
import { loginSchema, timeOffRequestSchema, employeeSchema } from '@/lib/validations/schemas';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345'
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('timeOffRequestSchema', () => {
    it('should validate correct time-off request', () => {
      const validData = {
        employee_id: 'emp123',
        start_date: '2025-01-01T09:00:00.000Z',
        end_date: '2025-01-02T17:00:00.000Z',
        reason: 'Vacation'
      };
      const result = timeOffRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject end date before start date', () => {
      const invalidData = {
        employee_id: 'emp123',
        start_date: '2025-01-02T09:00:00.000Z',
        end_date: '2025-01-01T17:00:00.000Z',
        reason: 'Vacation'
      };
      const result = timeOffRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require a reason', () => {
      const invalidData = {
        employee_id: 'emp123',
        start_date: '2025-01-01T09:00:00.000Z',
        end_date: '2025-01-02T17:00:00.000Z',
        reason: ''
      };
      const result = timeOffRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('employeeSchema', () => {
    it('should validate correct employee data', () => {
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'dispatcher',
        weeklyHours: 40
      };
      const result = employeeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'invalid-role',
        weeklyHours: 40
      };
      const result = employeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid weekly hours', () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role: 'dispatcher',
        weeklyHours: 60
      };
      const result = employeeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
}); 