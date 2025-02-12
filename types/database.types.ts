export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          auth_id: string
          first_name: string
          last_name: string
          email: string
          role: 'dispatcher' | 'supervisor' | 'manager'
          shift_pattern: 'pattern_a' | 'pattern_b' | 'custom'
          preferred_shift_category: 'early' | 'day' | 'swing' | 'graveyard' | null
          weekly_hours_cap: number
          max_overtime_hours: number
          last_shift_date: string | null
          total_hours_current_week: number
          consecutive_shifts_count: number
          created_by: string | null
          created_at: string
          updated_at: string
          weekly_hours: number
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['employees']['Insert']>
      }
      individual_shifts: {
        Row: {
          id: string
          employee_id: string
          shift_option_id: string
          schedule_period_id: string | null
          date: string
          status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
          is_overtime: boolean
          actual_start_time: string | null
          actual_end_time: string | null
          break_start_time: string | null
          break_end_time: string | null
          break_duration_minutes: number | null
          actual_hours_worked: number | null
          notes: string | null
          schedule_conflict_notes: string | null
          is_regular_schedule: boolean
          supervisor_approved_by: string | null
          supervisor_approved_at: string | null
          shift_score: number | null
          fatigue_level: number | null
        }
        Insert: Omit<Database['public']['Tables']['individual_shifts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['individual_shifts']['Insert']>
      }
      shift_options: {
        Row: {
          id: string
          name: string
          start_time: string
          end_time: string
          duration_hours: number
          category: 'early' | 'day' | 'swing' | 'graveyard'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['shift_options']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['shift_options']['Insert']>
      }
      staffing_requirements: {
        Row: {
          id: string
          name: string
          time_block_start: string
          time_block_end: string
          min_total_staff: number
          min_supervisors: number
          schedule_period_id: string | null
          is_holiday: boolean
          override_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['staffing_requirements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['staffing_requirements']['Insert']>
      }
      time_off_requests: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          status: 'pending' | 'approved' | 'denied'
          notes: string | null
          reason: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['time_off_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['time_off_requests']['Insert']>
      }
      shift_swap_requests: {
        Row: {
          id: string
          requester_id: string
          requested_employee_id: string
          shift_id: string
          proposed_shift_id: string | null
          status: 'pending' | 'approved' | 'denied'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['shift_swap_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['shift_swap_requests']['Insert']>
      }
    }
    Enums: {
      employee_role: 'dispatcher' | 'supervisor' | 'manager'
      shift_category: 'early' | 'day' | 'swing' | 'graveyard'
      shift_pattern: 'pattern_a' | 'pattern_b' | 'custom'
      shift_status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
      time_off_status: 'pending' | 'approved' | 'denied'
      log_severity: 'info' | 'warning' | 'error'
    }
  }
} 