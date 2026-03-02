import type { Session } from 'next-auth'

export type UserRole = 'ADMIN' | 'PHYSIOTHERAPIST' | 'RECEPTIONIST' | 'SUPER_ADMIN'
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type AppointmentType = 'INITIAL_EVALUATION' | 'FOLLOW_UP' | 'DISCHARGE' | 'RETURN'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type Plan = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
export type PaymentStatus = 'PENDING' | 'PAID' | 'INSURANCE' | 'WAIVED'
export type PaymentMethod = 'CASH' | 'PIX' | 'CARD' | 'INSURANCE' | 'OTHER'
export type InvoiceStatus = 'OPEN' | 'PAID' | 'OVERDUE' | 'CANCELED'
export type InsuranceStatus = 'BILLED' | 'RECEIVED' | 'PARTIAL' | 'GLOSA'
export type ExpenseCategory = 'RENT' | 'SALARY' | 'SUPPLIES' | 'EQUIPMENT' | 'UTILITIES' | 'MARKETING' | 'TAXES' | 'OTHER'
export type ExpenseStatus = 'PENDING' | 'PAID'
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  clinicSlug: string
}

export interface ExtendedSession extends Session {
  user: AuthUser
}

export interface Clinic {
  id: string
  name: string
  slug: string
  email: string
  phone?: string | null
  address?: string | null
  logo?: string | null
  isActive: boolean
  plan: Plan
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string | null
  avatar?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Patient {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  cpf?: string | null
  birthDate?: Date | null
  gender?: Gender | null
  address?: string | null
  healthInsurance?: string | null
  emergencyContact?: string | null
  notes?: string | null
  isActive: boolean
  physiotherapistId?: string | null
  physiotherapist?: { id: string; name: string } | null
  createdAt: Date
  updatedAt: Date
}

export interface Room {
  id: string
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Appointment {
  id: string
  patientId: string
  physiotherapistId: string
  roomId?: string | null
  startTime: Date
  endTime: Date
  status: AppointmentStatus
  type: AppointmentType
  notes?: string | null
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod | null
  paymentValue?: number | null
  createdAt: Date
  updatedAt: Date
  patient?: Patient
  physiotherapist?: User
  room?: Room | null
  session?: { id: string } | null
}

export interface ClinicalSession {
  id: string
  appointmentId: string
  patientId: string
  physiotherapistId: string
  sessionNumber: number
  techniques: string[]
  notes?: string | null
  evolution?: string | null
  painLevel?: number | null
  startTime: Date
  endTime: Date
  createdAt: Date
  updatedAt: Date
  patient?: Patient
  physiotherapist?: User
  appointment?: Appointment
}

export interface Anamnesis {
  id: string
  patientId: string
  chiefComplaint?: string | null
  history?: string | null
  medications?: string | null
  allergies?: string | null
  surgeries?: string | null
  familyHistory?: string | null
  lifestyle?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  appointmentsToday: number
  activePatients: number
  completedSessions: number
  physiotherapists: number
}

export interface ClinicSettings {
  id: string
  sessionDuration: number
  openingTime: string
  closingTime: string
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  id: string
  patientId: string
  totalAmount: number
  issuedAt: Date
  dueDate?: Date | null
  paidAt?: Date | null
  status: InvoiceStatus
  notes?: string | null
  isInsurance: boolean
  insuranceBilledAmount?: number | null
  insuranceExpectedAmount?: number | null
  insuranceReceivedAmount?: number | null
  insuranceStatus?: InsuranceStatus | null
  createdAt: Date
  updatedAt: Date
  patient?: Patient
  appointments?: Appointment[]
  payments?: Payment[]
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: PaymentMethod
  paidAt: Date
  transactionId?: string | null
  fees?: number | null
  isRefund: boolean
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  invoice?: Invoice
}

export interface Expense {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  dueDate: Date
  paidAt?: Date | null
  status: ExpenseStatus
  isRecurring: boolean
  recurrenceRule?: string | null
  parentExpenseId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface FinancialAuditLog {
  id: string
  entityType: string
  entityId: string
  action: AuditAction
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
  changedBy: string
  changedAt: Date
}
