export interface TimeOffRequest {
  id: string
  employee: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
} 