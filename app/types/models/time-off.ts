import type { AuditableModel } from './index'
import type { UUID } from '../shared/common'
import type { TimeOffStatus } from '../index'
import type { Employee } from './employee'

export interface TimeOffRequest extends AuditableModel {
  employeeId: UUID
  startDate: string
  endDate: string
  status: TimeOffStatus
  reason?: string
}

export interface TimeOffRequestWithDetails extends TimeOffRequest {
  employee: Employee
  approver?: {
    id: UUID
    firstName: string
    lastName: string
  }
}

export interface TimeOffRequestCreate {
  employeeId: UUID
  startDate: string
  endDate: string
  reason?: string
}

export interface TimeOffRequestUpdate {
  status: TimeOffStatus
  approverNotes?: string
} 