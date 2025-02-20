import type { Database } from './supabase/database'

/**
 * Shift pattern type from database enums
 */
export type ShiftPattern = 'PATTERN_A' | 'PATTERN_B'

/**
 * Shift pattern configuration
 */
export interface ShiftPatternConfig {
  name: string
  shifts: Array<{ duration: number; count: number }>
  totalHours: number
  consecutiveDays: number
}

/**
 * Shift pattern configurations
 */
export const SHIFT_PATTERNS = {
  PATTERN_A: 'PATTERN_A',
  PATTERN_B: 'PATTERN_B'
} as const

/**
 * Validates if a shift pattern is valid
 */
export function isValidShiftPattern(pattern: string): pattern is ShiftPattern {
  return pattern === 'PATTERN_A' || pattern === 'PATTERN_B'
}

/**
 * Gets the configuration for a shift pattern
 */
export function getShiftPatternConfig(pattern: ShiftPattern): ShiftPatternConfig {
  switch (pattern) {
    case 'PATTERN_A':
      return {
        name: 'Four Ten-Hour Shifts',
        shifts: [{ duration: 10, count: 4 }],
        totalHours: 40,
        consecutiveDays: 4
      }
    case 'PATTERN_B':
      return {
        name: 'Three Twelve-Hour Shifts Plus Four',
        shifts: [
          { duration: 12, count: 3 },
          { duration: 4, count: 1 }
        ],
        totalHours: 40,
        consecutiveDays: 4
      }
  }
}

/**
 * Converts a legacy pattern type to the new format
 */
export function normalizeShiftPattern(pattern: string): ShiftPattern {
  switch (pattern.toLowerCase()) {
    case 'pattern_a':
    case '4x10':
    case 'four_ten':
      return 'PATTERN_A'
    case 'pattern_b':
    case '3x12+4':
    case '3_12_plus_4':
    case 'three_twelve_plus_four':
      return 'PATTERN_B'
    default:
      return 'PATTERN_A' // Default to PATTERN_A for unknown patterns
  }
}

export interface Holiday {
  id: string
  date: string
  name: string
  description?: string
} 