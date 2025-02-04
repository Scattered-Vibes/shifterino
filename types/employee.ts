export type EmployeeRole = 'dispatcher' | 'supervisor' | 'manager'

export interface Employee {
  id: string
  user_id: string
  first_name: string
  last_name: string
  role: EmployeeRole
  created_at: string
  updated_at: string
}

export interface EmployeeWithUser extends Employee {
  user: {
    id: string
    email: string
  }
} 