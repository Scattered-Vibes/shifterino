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
          created_at: string
          email: string
          first_name: string
          last_name: string
          role: string
          shift_pattern: string
          weekly_hours: number
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          first_name: string
          last_name: string
          role: string
          shift_pattern?: string
          weekly_hours?: number
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: string
          shift_pattern?: string
          weekly_hours?: number
        }
      }
      schedules: {
        Row: {
          id: string
          created_at: string
          employee_id: string
          start_time: string
          end_time: string
          shift_type: string
          is_supervisor: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          employee_id: string
          start_time: string
          end_time: string
          shift_type: string
          is_supervisor?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          employee_id?: string
          start_time?: string
          end_time?: string
          shift_type?: string
          is_supervisor?: boolean
        }
      }
      time_off: {
        Row: {
          id: string
          created_at: string
          employee_id: string
          start_date: string
          end_date: string
          status: string
          reason: string
        }
        Insert: {
          id?: string
          created_at?: string
          employee_id: string
          start_date: string
          end_date: string
          status?: string
          reason: string
        }
        Update: {
          id?: string
          created_at?: string
          employee_id?: string
          start_date?: string
          end_date?: string
          status?: string
          reason?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 