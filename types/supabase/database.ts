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
      audit_logs: {
        Row: {
          action: string
          changed_data: Json | null
          created_at: string
          id: string
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          changed_data?: Json | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_data?: Json | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      department_members: {
        Row: {
          created_at: string
          department_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          manager_id: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          auth_id: string
          created_at: string | null
          created_by: string | null
          default_shift_end: string | null
          default_shift_start: string | null
          default_weekly_hours: number | null
          department_id: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          max_overtime_hours: number | null
          organization_id: string
          overtime_hours: number
          preferred_shift_category:
            | Database["public"]["Enums"]["shift_category"]
            | null
          profile_incomplete: boolean
          role: Database["public"]["Enums"]["employee_role"]
          shift_pattern: Database["public"]["Enums"]["shift_pattern_type"]
          team_id: string | null
          updated_at: string | null
          updated_by: string | null
          weekly_hours_cap: number | null
        }
        Insert: {
          auth_id: string
          created_at?: string | null
          created_by?: string | null
          default_shift_end?: string | null
          default_shift_start?: string | null
          default_weekly_hours?: number | null
          department_id?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          max_overtime_hours?: number | null
          organization_id: string
          overtime_hours?: number
          preferred_shift_category?:
            | Database["public"]["Enums"]["shift_category"]
            | null
          profile_incomplete?: boolean
          role: Database["public"]["Enums"]["employee_role"]
          shift_pattern: Database["public"]["Enums"]["shift_pattern_type"]
          team_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          weekly_hours_cap?: number | null
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          created_by?: string | null
          default_shift_end?: string | null
          default_shift_start?: string | null
          default_weekly_hours?: number | null
          department_id?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          max_overtime_hours?: number | null
          organization_id?: string
          overtime_hours?: number
          preferred_shift_category?:
            | Database["public"]["Enums"]["shift_category"]
            | null
          profile_incomplete?: boolean
          role?: Database["public"]["Enums"]["employee_role"]
          shift_pattern?: Database["public"]["Enums"]["shift_pattern_type"]
          team_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          weekly_hours_cap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_team_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          id: string
          to_user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          id?: string
          to_user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          to_user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          contact_info: Json
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          contact_info?: Json
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          contact_info?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          level: number | null
          name: string
          permissions: Json | null
          updated_at: string
          updated_by: string | null
          weekly_hour_limit: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          level?: number | null
          name: string
          permissions?: Json | null
          updated_at?: string
          updated_by?: string | null
          weekly_hour_limit?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          level?: number | null
          name?: string
          permissions?: Json | null
          updated_at?: string
          updated_by?: string | null
          weekly_hour_limit?: number | null
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string | null
          organization_id: string
          recipients: string[]
          report_parameters: Json | null
          report_type: string
          schedule_cron: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id: string
          recipients: string[]
          report_parameters?: Json | null
          report_type: string
          schedule_cron: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id?: string
          recipients?: string[]
          report_parameters?: Json | null
          report_type?: string
          schedule_cron?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_published: boolean
          name: string
          organization_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_published?: boolean
          name: string
          organization_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_published?: boolean
          name?: string
          organization_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          assigned_at: string
          id: string
          shift_id: string
          status: Database["public"]["Enums"]["shift_assignment_status"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          shift_id: string
          status?: Database["public"]["Enums"]["shift_assignment_status"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          shift_id?: string
          status?: Database["public"]["Enums"]["shift_assignment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
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
      shift_requirements: {
        Row: {
          created_at: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          department_id: string | null
          end_time: string
          id: string
          organization_id: string
          required_count: number
          role_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          department_id?: string | null
          end_time: string
          id?: string
          organization_id: string
          required_count: number
          role_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          department_id?: string | null
          end_time?: string
          id?: string
          organization_id?: string
          required_count?: number
          role_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_requirements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requirements_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_swaps: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          manager_id: string | null
          reason: string
          status: Database["public"]["Enums"]["shift_swap_status"]
          to_user_id: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          manager_id?: string | null
          reason: string
          status?: Database["public"]["Enums"]["shift_swap_status"]
          to_user_id?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          manager_id?: string | null
          reason?: string
          status?: Database["public"]["Enums"]["shift_swap_status"]
          to_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_swaps_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "shift_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_tasks: {
        Row: {
          assigned_to: string
          created_at: string
          id: string
          shift_id: string
          status: Database["public"]["Enums"]["shift_task_status"]
          task_name: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          created_at?: string
          id?: string
          shift_id: string
          status?: Database["public"]["Enums"]["shift_task_status"]
          task_name: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          id?: string
          shift_id?: string
          status?: Database["public"]["Enums"]["shift_task_status"]
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_tasks_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          date: string
          department_id: string | null
          end_time: string
          id: string
          is_auto_generated: boolean
          is_published: boolean
          schedule_id: string
          shift_type: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          department_id?: string | null
          end_time: string
          id?: string
          is_auto_generated?: boolean
          is_published?: boolean
          schedule_id: string
          shift_type?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          department_id?: string | null
          end_time?: string
          id?: string
          is_auto_generated?: boolean
          is_published?: boolean
          schedule_id?: string
          shift_type?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      staffing_requirements: {
        Row: {
          created_at: string
          end_time: string
          id: string
          min_employees: number
          min_supervisors: number
          start_time: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          min_employees: number
          min_supervisors?: number
          start_time: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          min_employees?: number
          min_supervisors?: number
          start_time?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staffing_requirements_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          organization_id: string | null
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          organization_id?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          organization_id?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_off_balances: {
        Row: {
          accrued: number
          allocated: number
          id: string
          type: string
          updated_at: string
          used: number
          user_id: string
        }
        Insert: {
          accrued?: number
          allocated: number
          id?: string
          type: string
          updated_at?: string
          used?: number
          user_id: string
        }
        Update: {
          accrued?: number
          allocated?: number
          id?: string
          type?: string
          updated_at?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      time_off_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["time_off_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["time_off_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["time_off_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_availability: {
        Row: {
          created_at: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          effective_end_date: string | null
          effective_start_date: string | null
          end_time: string
          id: string
          is_recurring: boolean
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          effective_end_date?: string | null
          effective_start_date?: string | null
          end_time: string
          id?: string
          is_recurring?: boolean
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          effective_end_date?: string | null
          effective_start_date?: string | null
          end_time?: string
          id?: string
          is_recurring?: boolean
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      day_of_week_to_int: {
        Args: {
          day: Database["public"]["Enums"]["day_of_week"]
        }
        Returns: number
      }
      execute_sql: {
        Args: {
          query: string
        }
        Returns: undefined
      }
      get_team_members: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_id: string
        }[]
      }
      int_to_day_of_week: {
        Args: {
          day_num: number
        }
        Returns: Database["public"]["Enums"]["day_of_week"]
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
      day_of_week:
        | "SUNDAY"
        | "MONDAY"
        | "TUESDAY"
        | "WEDNESDAY"
        | "THURSDAY"
        | "FRIDAY"
        | "SATURDAY"
      employee_role: "dispatcher" | "supervisor" | "manager"
      notification_type:
        | "SHIFT_ASSIGNED"
        | "SHIFT_CHANGED"
        | "TIME_OFF_REQUESTED"
        | "TIME_OFF_APPROVED"
        | "TIME_OFF_REJECTED"
        | "MESSAGE_RECEIVED"
        | "SYSTEM_ALERT"
        | "SHIFT_SWAP_REQUESTED"
        | "SHIFT_SWAP_APPROVED"
        | "SHIFT_SWAP_REJECTED"
        | "MINIMUM_STAFFING_ALERT"
        | "SUPERVISOR_REQUIRED_ALERT"
      shift_assignment_status: "ASSIGNED" | "SWAPPED" | "CANCELLED"
      shift_category: "early" | "day" | "swing" | "graveyard"
      shift_pattern_type: "4x10" | "3x12_plus_4"
      shift_swap_status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
      shift_task_status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
      time_off_request_status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
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

