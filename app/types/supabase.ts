export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Tables = {
  employees: {
    Row: {
      id: string
      auth_id: string
      first_name: string
      last_name: string
      role: 'admin' | 'manager' | 'supervisor' | 'dispatcher'
      is_active: boolean
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      auth_id: string
      first_name: string
      last_name: string
      role: 'admin' | 'manager' | 'supervisor' | 'dispatcher'
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      auth_id?: string
      first_name?: string
      last_name?: string
      role?: 'admin' | 'manager' | 'supervisor' | 'dispatcher'
      is_active?: boolean
      created_at?: string
      updated_at?: string
    }
  }
  time_off_requests: {
    Row: {
      id: string
      employee_id: string
      start_date: string
      end_date: string
      reason: string
      notes: string | null
      status: 'pending' | 'approved' | 'rejected'
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      employee_id: string
      start_date: string
      end_date: string
      reason: string
      notes?: string | null
      status?: 'pending' | 'approved' | 'rejected'
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      employee_id?: string
      start_date?: string
      end_date?: string
      reason?: string
      notes?: string | null
      status?: 'pending' | 'approved' | 'rejected'
      created_at?: string
      updated_at?: string
    }
  }
  overtime_requests: {
    Row: {
      id: string
      employee_id: string
      date: string
      hours: number
      reason: string
      status: 'pending' | 'approved' | 'rejected'
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      employee_id: string
      date: string
      hours: number
      reason: string
      status?: 'pending' | 'approved' | 'rejected'
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      employee_id?: string
      date?: string
      hours?: number
      reason?: string
      status?: 'pending' | 'approved' | 'rejected'
      created_at?: string
      updated_at?: string
    }
  }
  shift_swap_requests: {
    Row: {
      id: string
      requester_id: string
      accepter_id: string | null
      original_shift_id: string
      swap_shift_id: string | null
      status: 'pending' | 'approved' | 'rejected'
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      requester_id: string
      accepter_id?: string | null
      original_shift_id: string
      swap_shift_id?: string | null
      status?: 'pending' | 'approved' | 'rejected'
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      requester_id?: string
      accepter_id?: string | null
      original_shift_id?: string
      swap_shift_id?: string | null
      status?: 'pending' | 'approved' | 'rejected'
      created_at?: string
      updated_at?: string
    }
  }
  on_call_assignments: {
    Row: {
      id: string
      employee_id: string
      start_time: string
      end_time: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      employee_id: string
      start_time: string
      end_time: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      employee_id?: string
      start_time?: string
      end_time?: string
      created_at?: string
      updated_at?: string
    }
  }
}

export type Enums = {
  [_ in never]: never
}

export type RPCFunctions = {
  get_total_scheduled_hours: {
    Args: {
      employee_id: string
      start_date: string
      end_date: string
    }
    Returns: { data: number }
  }
  get_total_overtime_hours: {
    Args: {
      employee_id: string
      start_date: string
      end_date: string
    }
    Returns: { data: number }
  }
}

export interface Database {
  public: {
    Tables: Tables
    Enums: Enums
    Functions: RPCFunctions
  }
} 