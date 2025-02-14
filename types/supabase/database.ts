export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assigned_shifts: {
        Row: {
          actual_hours_worked: number | null
          created_at: string
          created_by: string | null
          date: string
          employee_id: string | null
          id: string
          notes: string | null
          overtime_approved: boolean | null
          overtime_approved_at: string | null
          overtime_approved_by: string | null
          schedule_period_id: string | null
          shift_option_id: string | null
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_hours_worked?: number | null
          created_at?: string
          created_by?: string | null
          date: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          overtime_approved?: boolean | null
          overtime_approved_at?: string | null
          overtime_approved_by?: string | null
          schedule_period_id?: string | null
          shift_option_id?: string | null
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_hours_worked?: number | null
          created_at?: string
          created_by?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          overtime_approved?: boolean | null
          overtime_approved_at?: string | null
          overtime_approved_by?: string | null
          schedule_period_id?: string | null
          shift_option_id?: string | null
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assigned_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_shifts_shift_option_id_fkey"
            columns: ["shift_option_id"]
            isOneToOne: false
            referencedRelation: "shift_options"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          auth_id: string | null
          created_at: string | null
          created_by: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          max_overtime_hours: number | null
          preferred_shift_category: Database["public"]["Enums"]["shift_category"]
          role: Database["public"]["Enums"]["employee_role"]
          shift_pattern: Database["public"]["Enums"]["shift_pattern"]
          team_id: string | null
          updated_at: string | null
          updated_by: string | null
          weekly_hours_cap: number | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          max_overtime_hours?: number | null
          preferred_shift_category: Database["public"]["Enums"]["shift_category"]
          role: Database["public"]["Enums"]["employee_role"]
          shift_pattern: Database["public"]["Enums"]["shift_pattern"]
          team_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          weekly_hours_cap?: number | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          max_overtime_hours?: number | null
          preferred_shift_category?: Database["public"]["Enums"]["shift_category"]
          role?: Database["public"]["Enums"]["employee_role"]
          shift_pattern?: Database["public"]["Enums"]["shift_pattern"]
          team_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          weekly_hours_cap?: number | null
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          name: string
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          name: string
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      on_call_activations: {
        Row: {
          activation_time: string
          assignment_id: string | null
          created_at: string | null
          deactivation_time: string | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          activation_time: string
          assignment_id?: string | null
          created_at?: string | null
          deactivation_time?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          activation_time?: string
          assignment_id?: string | null
          created_at?: string | null
          deactivation_time?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "on_call_activations_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "on_call_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      on_call_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          end_datetime: string
          id: string
          schedule_period_id: string
          start_datetime: string
          status: Database["public"]["Enums"]["on_call_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          end_datetime: string
          id?: string
          schedule_period_id: string
          start_datetime: string
          status?: Database["public"]["Enums"]["on_call_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          end_datetime?: string
          id?: string
          schedule_period_id?: string
          start_datetime?: string
          status?: Database["public"]["Enums"]["on_call_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "on_call_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_periods: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          is_published: boolean | null
          start_date: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          is_published?: boolean | null
          start_date: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          is_published?: boolean | null
          start_date?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      shift_options: {
        Row: {
          created_at: string | null
          created_by: string | null
          duration_hours: number
          end_time: string
          id: string
          is_default: boolean | null
          name: string
          start_time: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          duration_hours: number
          end_time: string
          id?: string
          is_default?: boolean | null
          name: string
          start_time: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          duration_hours?: number
          end_time?: string
          id?: string
          is_default?: boolean | null
          name?: string
          start_time?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      shift_pattern_rules: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          is_default: boolean
          pattern: Database["public"]["Enums"]["shift_pattern"]
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          is_default?: boolean
          pattern: Database["public"]["Enums"]["shift_pattern"]
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          is_default?: boolean
          pattern?: Database["public"]["Enums"]["shift_pattern"]
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_pattern_rules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_swap_requests: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          receiving_employee_id: string
          receiving_shift_id: string | null
          requesting_employee_id: string
          requesting_shift_id: string
          status: Database["public"]["Enums"]["swap_request_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          receiving_employee_id: string
          receiving_shift_id?: string | null
          requesting_employee_id: string
          requesting_shift_id: string
          status?: Database["public"]["Enums"]["swap_request_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          receiving_employee_id?: string
          receiving_shift_id?: string | null
          requesting_employee_id?: string
          requesting_shift_id?: string
          status?: Database["public"]["Enums"]["swap_request_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_receiving_employee_id_fkey"
            columns: ["receiving_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_receiving_shift_id_fkey"
            columns: ["receiving_shift_id"]
            isOneToOne: false
            referencedRelation: "assigned_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requesting_employee_id_fkey"
            columns: ["requesting_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requesting_shift_id_fkey"
            columns: ["requesting_shift_id"]
            isOneToOne: false
            referencedRelation: "assigned_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      staffing_requirements: {
        Row: {
          created_at: string
          created_by: string | null
          day_of_week: string | null
          id: string
          min_employees: number
          schedule_period_id: string | null
          time_block_end: string
          time_block_start: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_of_week?: string | null
          id?: string
          min_employees: number
          schedule_period_id?: string | null
          time_block_end: string
          time_block_start: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_of_week?: string | null
          id?: string
          min_employees?: number
          schedule_period_id?: string | null
          time_block_end?: string
          time_block_start?: string
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
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["time_off_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["time_off_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["time_off_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gbt_bit_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      get_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
        }[]
      }
      get_team_members: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_id: string
        }[]
      }
      is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_supervisor_or_above: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      employee_role: "dispatcher" | "supervisor" | "manager"
      holiday_type: "FEDERAL" | "COMPANY" | "OTHER"
      on_call_status: "scheduled" | "active" | "completed" | "cancelled"
      schedule_status: "draft" | "published" | "archived"
      shift_category: "DAY" | "SWING" | "NIGHT"
      shift_pattern: "4_10" | "3_12_4"
      shift_status: "scheduled" | "completed" | "cancelled"
      swap_request_status: "pending" | "approved" | "rejected" | "cancelled"
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

