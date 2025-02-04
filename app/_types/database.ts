export interface Schedule {
  id: string
  employee_id: string
  shift_date: string
  shift_type: 'day_early' | 'day' | 'swing' | 'graveyard'
  start_time: string
  end_time: string
  is_supervisor_shift: boolean
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  is_supervisor: boolean
  weekly_hours_cap: number
  shift_pattern: 'pattern_a' | 'pattern_b'
  created_at: string
  updated_at: string
}

export type EmployeeRole = 'dispatcher' | 'supervisor' | 'manager'

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: Employee
        Insert: Omit<Employee, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Employee, 'id'>>
      }
      schedules: {
        Row: {
          id: string
          employee_id: string
          start_time: string
          end_time: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Employee, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Employee, 'id'>>
      }
      time_off_requests: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          status: 'pending' | 'approved' | 'rejected'
          reason: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Employee, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Employee, 'id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_employee_role: {
        Args: { user_auth_id: string }
        Returns: string
      }
    }
    Enums: {
      employee_role: EmployeeRole
      shift_pattern: 'four_ten' | 'three_twelve'
    }
  }
} 