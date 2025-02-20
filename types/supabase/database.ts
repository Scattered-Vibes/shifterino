export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assigned_shifts: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          employee_id: string
          id: string
          shift_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          employee_id: string
          id?: string
          shift_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          employee_id?: string
          id?: string
          shift_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assigned_shifts_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_logs: {
        Row: {
          auth_id: string | null
          created_at: string
          details: Json | null
          email: string
          error_message: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          details?: Json | null
          email: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          details?: Json | null
          email?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          auth_id: string | null
          created_at: string
          created_by: string | null
          default_weekly_hours: number
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          max_overtime_hours: number
          overtime_hours: number
          preferred_shift_category:
            | Database["public"]["Enums"]["shift_category"]
            | null
          profile_incomplete: boolean
          role: Database["public"]["Enums"]["employee_role"]
          shift_pattern: Database["public"]["Enums"]["shift_pattern"]
          team_id: string | null
          updated_at: string
          updated_by: string | null
          weekly_hours_cap: number
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          created_by?: string | null
          default_weekly_hours?: number
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          max_overtime_hours?: number
          overtime_hours?: number
          preferred_shift_category?:
            | Database["public"]["Enums"]["shift_category"]
            | null
          profile_incomplete?: boolean
          role: Database["public"]["Enums"]["employee_role"]
          shift_pattern?: Database["public"]["Enums"]["shift_pattern"]
          team_id?: string | null
          updated_at?: string
          updated_by?: string | null
          weekly_hours_cap?: number
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          created_by?: string | null
          default_weekly_hours?: number
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          max_overtime_hours?: number
          overtime_hours?: number
          preferred_shift_category?:
            | Database["public"]["Enums"]["shift_category"]
            | null
          profile_incomplete?: boolean
          role?: Database["public"]["Enums"]["employee_role"]
          shift_pattern?: Database["public"]["Enums"]["shift_pattern"]
          team_id?: string | null
          updated_at?: string
          updated_by?: string | null
          weekly_hours_cap?: number
        }
        Relationships: [
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          is_observed: boolean | null
          name: string
          type: Database["public"]["Enums"]["holiday_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          is_observed?: boolean | null
          name: string
          type: Database["public"]["Enums"]["holiday_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_observed?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["holiday_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      individual_shifts: {
        Row: {
          actual_end_time: string | null
          actual_hours_worked: number | null
          actual_start_time: string | null
          break_duration_minutes: number | null
          break_end_time: string | null
          break_start_time: string | null
          created_at: string
          created_by: string | null
          date: string
          employee_id: string
          fatigue_level: number | null
          id: string
          is_overtime: boolean | null
          is_regular_schedule: boolean | null
          notes: string | null
          schedule_conflict_notes: string | null
          schedule_period_id: string | null
          shift_option_id: string
          shift_score: number | null
          status: Database["public"]["Enums"]["shift_status"]
          supervisor_approved_at: string | null
          supervisor_approved_by: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_hours_worked?: number | null
          actual_start_time?: string | null
          break_duration_minutes?: number | null
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          employee_id: string
          fatigue_level?: number | null
          id?: string
          is_overtime?: boolean | null
          is_regular_schedule?: boolean | null
          notes?: string | null
          schedule_conflict_notes?: string | null
          schedule_period_id?: string | null
          shift_option_id: string
          shift_score?: number | null
          status?: Database["public"]["Enums"]["shift_status"]
          supervisor_approved_at?: string | null
          supervisor_approved_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_hours_worked?: number | null
          actual_start_time?: string | null
          break_duration_minutes?: number | null
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          employee_id?: string
          fatigue_level?: number | null
          id?: string
          is_overtime?: boolean | null
          is_regular_schedule?: boolean | null
          notes?: string | null
          schedule_conflict_notes?: string | null
          schedule_period_id?: string | null
          shift_option_id?: string
          shift_score?: number | null
          status?: Database["public"]["Enums"]["shift_status"]
          supervisor_approved_at?: string | null
          supervisor_approved_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "individual_shifts_schedule_period_id_fkey"
            columns: ["schedule_period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_shifts_shift_option_id_fkey"
            columns: ["shift_option_id"]
            isOneToOne: false
            referencedRelation: "shift_options"
            referencedColumns: ["id"]
          },
        ]
      }
      on_call_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          end_time: string
          id: string
          notes: string | null
          start_time: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      schedule_periods: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["schedule_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      shift_options: {
        Row: {
          category: Database["public"]["Enums"]["shift_category"]
          created_at: string
          created_by: string | null
          duration_hours: number
          end_time: string
          id: string
          is_overnight: boolean
          name: string
          start_time: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["shift_category"]
          created_at?: string
          created_by?: string | null
          duration_hours: number
          end_time: string
          id?: string
          is_overnight?: boolean
          name: string
          start_time: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["shift_category"]
          created_at?: string
          created_by?: string | null
          duration_hours?: number
          end_time?: string
          id?: string
          is_overnight?: boolean
          name?: string
          start_time?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      shift_swap_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          proposed_shift_id: string | null
          receiving_employee_id: string
          requesting_employee_id: string
          requesting_shift_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          proposed_shift_id?: string | null
          receiving_employee_id: string
          requesting_employee_id: string
          requesting_shift_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          proposed_shift_id?: string | null
          receiving_employee_id?: string
          requesting_employee_id?: string
          requesting_shift_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_proposed_shift_id_fkey"
            columns: ["proposed_shift_id"]
            isOneToOne: false
            referencedRelation: "individual_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requesting_shift_id_fkey"
            columns: ["requesting_shift_id"]
            isOneToOne: false
            referencedRelation: "individual_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          category: Database["public"]["Enums"]["shift_category"]
          created_at: string
          created_by: string | null
          duration_hours: number
          end_time: string
          id: string
          is_overnight: boolean
          name: string
          start_time: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["shift_category"]
          created_at?: string
          created_by?: string | null
          duration_hours: number
          end_time: string
          id?: string
          is_overnight?: boolean
          name: string
          start_time: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["shift_category"]
          created_at?: string
          created_by?: string | null
          duration_hours?: number
          end_time?: string
          id?: string
          is_overnight?: boolean
          name?: string
          start_time?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      staffing_requirements: {
        Row: {
          created_at: string
          created_by: string | null
          day_of_week: number
          id: string
          is_holiday: boolean | null
          min_supervisors: number
          min_total_staff: number
          name: string
          override_reason: string | null
          schedule_period_id: string | null
          time_block_end: string
          time_block_start: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          id?: string
          is_holiday?: boolean | null
          min_supervisors?: number
          min_total_staff: number
          name: string
          override_reason?: string | null
          schedule_period_id?: string | null
          time_block_end: string
          time_block_start: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          id?: string
          is_holiday?: boolean | null
          min_supervisors?: number
          min_total_staff?: number
          name?: string
          override_reason?: string | null
          schedule_period_id?: string | null
          time_block_end?: string
          time_block_start?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staffing_requirements_schedule_period_id_fkey"
            columns: ["schedule_period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      time_off_requests: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          end_date: string
          id: string
          notes: string | null
          reason: string
          start_date: string
          status: Database["public"]["Enums"]["time_off_status"]
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          end_date: string
          id?: string
          notes?: string | null
          reason: string
          start_date: string
          status?: Database["public"]["Enums"]["time_off_status"]
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          notes?: string | null
          reason?: string
          start_date?: string
          status?: Database["public"]["Enums"]["time_off_status"]
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_shift_overlap_for_employee: {
        Args: {
          p_employee_id: string
          p_shift_id: string
          p_date: string
          p_assigned_shift_id?: string
        }
        Returns: boolean
      }
      check_time_off_overlap: {
        Args: {
          p_employee_id: string
          p_start_date: string
          p_end_date: string
          p_request_id?: string
        }
        Returns: boolean
      }
      create_assigned_shift_and_individual_shift: {
        Args: {
          p_employee_id: string
          p_shift_id: string
          p_date: string
        }
        Returns: string
      }
      create_individual_shift: {
        Args: {
          p_employee_id: string
          p_shift_option_id: string
          p_schedule_period_id: string
          p_date: string
        }
        Returns: string
      }
      get_auth_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_schedule_period: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          start_date: string
          end_date: string
          status: Database["public"]["Enums"]["schedule_status"]
          description: string
        }[]
      }
      get_employee_id: {
        Args: {
          p_auth_id: string
        }
        Returns: string
      }
      get_employee_shift_pattern: {
        Args: {
          p_auth_id: string
        }
        Returns: string
      }
      get_shift_options_by_pattern: {
        Args: {
          p_shift_pattern: string
        }
        Returns: {
          id: string
          name: string
          category: Database["public"]["Enums"]["shift_category"]
          start_time: string
          end_time: string
          duration_hours: number
          is_overnight: boolean
        }[]
      }
      publish_schedule_period: {
        Args: {
          p_schedule_period_id: string
        }
        Returns: undefined
      }
      update_time_off_request_status: {
        Args: {
          p_request_id: string
          p_new_status: Database["public"]["Enums"]["time_off_status"]
          p_notes?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      employee_role: "dispatcher" | "supervisor" | "manager"
      holiday_type: "FEDERAL" | "COMPANY" | "OTHER"
      schedule_status: "draft" | "published" | "archived"
      shift_category: "early" | "day" | "swing" | "graveyard"
      shift_pattern: "4x10" | "3x12_plus_4"
      shift_status: "scheduled" | "completed" | "cancelled"
      time_off_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
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
