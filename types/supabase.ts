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
      schedules: {
        Row: {
          id: string
          employee_id: string
          shift_option_id: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          shift_option_id: string
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          shift_option_id?: string
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      shift_options: {
        Row: {
          id: string
          name: string
          start_time: string
          end_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          start_time: string
          end_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_time?: string
          end_time?: string
          created_at?: string
          updated_at?: string
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