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
      audit_logs: {
        Row: {
          id: string
          action: string
          table_name: string
          record_id: string
          old_values: Json | null
          new_values: Json | null
          performed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          table_name: string
          record_id: string
          old_values?: Json | null
          new_values?: Json | null
          performed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_values?: Json | null
          new_values?: Json | null
          performed_by?: string | null
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          auth_id: string
          role: string
          shift_pattern: string
          weekly_hours_cap: number
          consecutive_shifts_count: number | null
          last_shift_date: string | null
          created_at: string
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          auth_id: string
          role: string
          shift_pattern: string
          weekly_hours_cap: number
          consecutive_shifts_count?: number | null
          last_shift_date?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          auth_id?: string
          role?: string
          shift_pattern?: string
          weekly_hours_cap?: number
          consecutive_shifts_count?: number | null
          last_shift_date?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
      individual_shifts: {
        Row: {
          id: string
          employee_id: string
          shift_option_id: string
          date: string
          requested_overtime: boolean
          overtime_approved_by: string | null
          overtime_approved_at: string | null
          created_at: string
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          shift_option_id: string
          date: string
          requested_overtime?: boolean
          overtime_approved_by?: string | null
          overtime_approved_at?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          shift_option_id?: string
          date?: string
          requested_overtime?: boolean
          overtime_approved_by?: string | null
          overtime_approved_at?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
      on_call_assignments: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          status: string
          created_at: string
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          start_date: string
          end_date: string
          status: string
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          start_date?: string
          end_date?: string
          status?: string
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
      shift_options: {
        Row: {
          id: string
          name: string
          start_time: string
          end_time: string
          created_at: string
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
          start_time: string
          end_time: string
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          start_time?: string
          end_time?: string
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
      shift_swap_requests: {
        Row: {
          id: string
          requesting_employee_id: string
          target_employee_id: string
          requesting_shift_id: string
          target_shift_id: string
          reason: string
          status: 'pending' | 'approved' | 'rejected'
          requested_at: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          created_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          requesting_employee_id: string
          target_employee_id: string
          requesting_shift_id: string
          target_shift_id: string
          reason: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          requesting_employee_id?: string
          target_employee_id?: string
          requesting_shift_id?: string
          target_shift_id?: string
          reason?: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
    }
    Views: {
      overtime_report: {
        Row: {
          employee_id: string
          employee_name: string
          week_start_date: string
          total_hours: number
          overtime_hours: number
        }
      }
      staffing_level_report: {
        Row: {
          date: string
          time_period: string
          required_staff: number
          actual_staff: number
          variance: number
        }
      }
    }
    Functions: {
      swap_shifts: {
        Args: {
          requesting_shift_id: string
          target_shift_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
