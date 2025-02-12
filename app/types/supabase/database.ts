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
      auth_logs: {
        Row: {
          details: Json | null
          error_message: string | null
          id: number
          operation: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          details?: Json | null
          error_message?: string | null
          id?: number
          operation?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          details?: Json | null
          error_message?: string | null
          id?: number
          operation?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          auth_id: string
          consecutive_shifts_count: number | null
          created_at: string
          created_by: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          last_shift_date: string | null
          max_overtime_hours: number | null
          preferred_shift_category:
            | Database["public"]["Enums"]["shift_category"]
            | null
          role: Database["public"]["Enums"]["employee_role"]
          shift_pattern: Database["public"]["Enums"]["shift_pattern"]
          total_hours_current_week: number | null
          updated_at: string
          weekly_hours: number
          weekly_hours_cap: number
        }
        Insert: {
          auth_id: string
          consecutive_shifts_count?: number | null
          created_at?: string
          created_by?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          last_shift_date?: string | null
          max_overtime_hours?: number | null
          preferred_shift_category?:
            | Database["public"]["Enums"]["shift_category"]
            | null
          role: Database["public"]["Enums"]["employee_role"]
          shift_pattern: Database["public"]["Enums"]["shift_pattern"]
          total_hours_current_week?: number | null
          updated_at?: string
          weekly_hours?: number
          weekly_hours_cap?: number
        }
        Update: {
          auth_id?: string
          consecutive_shifts_count?: number | null
          created_at?: string
          created_by?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          last_shift_date?: string | null
          max_overtime_hours?: number | null
          preferred_shift_category?:
            | Database["public"]["Enums"]["shift_category"]
            | null
          role?: Database["public"]["Enums"]["employee_role"]
          shift_pattern?: Database["public"]["Enums"]["shift_pattern"]
          total_hours_current_week?: number | null
          updated_at?: string
          weekly_hours?: number
          weekly_hours_cap?: number
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
          date: string
          employee_id: string
          fatigue_level: number | null
          id: string
          is_overtime: boolean
          is_regular_schedule: boolean
          notes: string | null
          schedule_conflict_notes: string | null
          schedule_period_id: string | null
          shift_option_id: string
          shift_score: number | null
          status: Database["public"]["Enums"]["shift_status"]
          supervisor_approved_at: string | null
          supervisor_approved_by: string | null
          updated_at: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_hours_worked?: number | null
          actual_start_time?: string | null
          break_duration_minutes?: number | null
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          date: string
          employee_id: string
          fatigue_level?: number | null
          id?: string
          is_overtime?: boolean
          is_regular_schedule?: boolean
          notes?: string | null
          schedule_conflict_notes?: string | null
          schedule_period_id?: string | null
          shift_option_id: string
          shift_score?: number | null
          status?: Database["public"]["Enums"]["shift_status"]
          supervisor_approved_at?: string | null
          supervisor_approved_by?: string | null
          updated_at?: string
        }
        Update: {
          actual_end_time?: string | null
          actual_hours_worked?: number | null
          actual_start_time?: string | null
          break_duration_minutes?: number | null
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          fatigue_level?: number | null
          id?: string
          is_overtime?: boolean
          is_regular_schedule?: boolean
          notes?: string | null
          schedule_conflict_notes?: string | null
          schedule_period_id?: string | null
          shift_option_id?: string
          shift_score?: number | null
          status?: Database["public"]["Enums"]["shift_status"]
          supervisor_approved_at?: string | null
          supervisor_approved_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "individual_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "mv_schedule_statistics"
            referencedColumns: ["employee_id"]
          },
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
          {
            foreignKeyName: "individual_shifts_supervisor_approved_by_fkey"
            columns: ["supervisor_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_shifts_supervisor_approved_by_fkey"
            columns: ["supervisor_approved_by"]
            isOneToOne: false
            referencedRelation: "mv_schedule_statistics"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_email_verified: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_email_verified?: boolean | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_email_verified?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_periods: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          created_by: string
          employee_id: string
          end_date: string
          id: string
          is_supervisor: boolean
          shift_pattern: Database["public"]["Enums"]["shift_pattern"]
          shift_type: string
          start_date: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          employee_id: string
          end_date: string
          id?: string
          is_supervisor?: boolean
          shift_pattern: Database["public"]["Enums"]["shift_pattern"]
          shift_type: string
          start_date: string
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          employee_id?: string
          end_date?: string
          id?: string
          is_supervisor?: boolean
          shift_pattern?: Database["public"]["Enums"]["shift_pattern"]
          shift_type?: string
          start_date?: string
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      scheduling_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          log_message: string
          related_employee_id: string | null
          schedule_period_id: string | null
          severity: Database["public"]["Enums"]["log_severity"]
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          log_message: string
          related_employee_id?: string | null
          schedule_period_id?: string | null
          severity: Database["public"]["Enums"]["log_severity"]
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          log_message?: string
          related_employee_id?: string | null
          schedule_period_id?: string | null
          severity?: Database["public"]["Enums"]["log_severity"]
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_logs_related_employee_id_fkey"
            columns: ["related_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_logs_related_employee_id_fkey"
            columns: ["related_employee_id"]
            isOneToOne: false
            referencedRelation: "mv_schedule_statistics"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "scheduling_logs_schedule_period_id_fkey"
            columns: ["schedule_period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignment_scores: {
        Row: {
          created_at: string | null
          employee_id: string
          fairness_score: number
          fatigue_score: number
          id: string
          preference_score: number
          schedule_period_id: string
          shift_id: string
          total_score: number
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          fairness_score: number
          fatigue_score: number
          id?: string
          preference_score: number
          schedule_period_id: string
          shift_id: string
          total_score: number
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          fairness_score?: number
          fatigue_score?: number
          id?: string
          preference_score?: number
          schedule_period_id?: string
          shift_id?: string
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignment_scores_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignment_scores_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "mv_schedule_statistics"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "shift_assignment_scores_schedule_period_id_fkey"
            columns: ["schedule_period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignment_scores_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "individual_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_options: {
        Row: {
          category: Database["public"]["Enums"]["shift_category"]
          created_at: string
          duration_hours: number
          end_time: string
          id: string
          name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["shift_category"]
          created_at?: string
          duration_hours: number
          end_time: string
          id?: string
          name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["shift_category"]
          created_at?: string
          duration_hours?: number
          end_time?: string
          id?: string
          name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      shift_pattern_rules: {
        Row: {
          consecutive_shifts: number
          created_at: string
          id: string
          min_rest_hours: number
          pattern: Database["public"]["Enums"]["shift_pattern"]
          shift_durations: number[]
          updated_at: string
        }
        Insert: {
          consecutive_shifts: number
          created_at?: string
          id?: string
          min_rest_hours?: number
          pattern: Database["public"]["Enums"]["shift_pattern"]
          shift_durations: number[]
          updated_at?: string
        }
        Update: {
          consecutive_shifts?: number
          created_at?: string
          id?: string
          min_rest_hours?: number
          pattern?: Database["public"]["Enums"]["shift_pattern"]
          shift_durations?: number[]
          updated_at?: string
        }
        Relationships: []
      }
      shift_swap_requests: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          proposed_shift_id: string | null
          requested_employee_id: string
          requester_id: string
          shift_id: string
          status: Database["public"]["Enums"]["time_off_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          proposed_shift_id?: string | null
          requested_employee_id: string
          requester_id: string
          shift_id: string
          status?: Database["public"]["Enums"]["time_off_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          proposed_shift_id?: string | null
          requested_employee_id?: string
          requester_id?: string
          shift_id?: string
          status?: Database["public"]["Enums"]["time_off_status"]
          updated_at?: string | null
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
            foreignKeyName: "shift_swap_requests_requested_employee_id_fkey"
            columns: ["requested_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requested_employee_id_fkey"
            columns: ["requested_employee_id"]
            isOneToOne: false
            referencedRelation: "mv_schedule_statistics"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "mv_schedule_statistics"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "shift_swap_requests_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "individual_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      staffing_requirements: {
        Row: {
          created_at: string
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
        }
        Insert: {
          created_at?: string
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
        }
        Update: {
          created_at?: string
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
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      time_off_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          notes: string | null
          reason: string
          start_date: string
          status: Database["public"]["Enums"]["time_off_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          notes?: string | null
          reason: string
          start_date: string
          status?: Database["public"]["Enums"]["time_off_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          notes?: string | null
          reason?: string
          start_date?: string
          status?: Database["public"]["Enums"]["time_off_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "mv_schedule_statistics"
            referencedColumns: ["employee_id"]
          },
        ]
      }
    }
    Views: {
      mv_schedule_statistics: {
        Row: {
          avg_hours_per_shift: number | null
          avg_score: number | null
          employee_id: string | null
          first_name: string | null
          last_name: string | null
          periods_worked: number | null
          role: Database["public"]["Enums"]["employee_role"] | null
          total_hours: number | null
          total_shifts: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      validate_session: {
        Args: {
          session_token: string
        }
        Returns: boolean
      }
    }
    Enums: {
      employee_role: "dispatcher" | "supervisor" | "manager"
      log_severity: "info" | "warning" | "error"
      shift_category: "early" | "day" | "swing" | "graveyard"
      shift_pattern: "pattern_a" | "pattern_b" | "custom"
      shift_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "missed"
        | "cancelled"
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
