-- Provision script for tenant schema
-- This script is idempotent and safe to run multiple times
-- Replace {SCHEMA} with the actual schema name (e.g., clinic_slugname)

CREATE SCHEMA IF NOT EXISTS "{SCHEMA}";

SET search_path TO "{SCHEMA}";

CREATE TYPE IF NOT EXISTS "{SCHEMA}"."UserRole" AS ENUM ('ADMIN', 'PHYSIOTHERAPIST', 'RECEPTIONIST');
CREATE TYPE IF NOT EXISTS "{SCHEMA}"."AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE IF NOT EXISTS "{SCHEMA}"."AppointmentType" AS ENUM ('INITIAL_EVALUATION', 'FOLLOW_UP', 'DISCHARGE', 'RETURN');
CREATE TYPE IF NOT EXISTS "{SCHEMA}"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE IF NOT EXISTS "{SCHEMA}"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'INSURANCE', 'WAIVED');
CREATE TYPE IF NOT EXISTS "{SCHEMA}"."PaymentMethod" AS ENUM ('CASH', 'PIX', 'CARD', 'INSURANCE', 'OTHER');
CREATE TYPE IF NOT EXISTS "{SCHEMA}"."InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'OVERDUE', 'CANCELED');
CREATE TYPE IF NOT EXISTS "{SCHEMA}"."InsuranceStatus" AS ENUM ('BILLED', 'RECEIVED', 'PARTIAL', 'GLOSA');
CREATE TYPE IF NOT EXISTS "{SCHEMA}"."ExpenseCategory" AS ENUM ('RENT', 'SALARY', 'SUPPLIES', 'EQUIPMENT', 'UTILITIES', 'MARKETING', 'TAXES', 'OTHER');
CREATE TYPE IF NOT EXISTS "{SCHEMA}"."ExpenseStatus" AS ENUM ('PENDING', 'PAID');
CREATE TYPE IF NOT EXISTS "{SCHEMA}"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE');

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "{SCHEMA}"."UserRole" NOT NULL DEFAULT 'PHYSIOTHERAPIST',
  "phone" TEXT,
  "avatar" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "{SCHEMA}"."User"("email");

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."Patient" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "cpf" TEXT,
  "birthDate" TIMESTAMP(3),
  "gender" "{SCHEMA}"."Gender",
  "address" TEXT,
  "healthInsurance" TEXT,
  "emergencyContact" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Patient_cpf_key" ON "{SCHEMA}"."Patient"("cpf") WHERE "cpf" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."Room" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."Invoice" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "totalAmount" DECIMAL(10,2) NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "status" "{SCHEMA}"."InvoiceStatus" NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "isInsurance" BOOLEAN NOT NULL DEFAULT false,
  "insuranceBilledAmount" DECIMAL(10,2),
  "insuranceExpectedAmount" DECIMAL(10,2),
  "insuranceReceivedAmount" DECIMAL(10,2),
  "insuranceStatus" "{SCHEMA}"."InsuranceStatus",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "{SCHEMA}"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Invoice_patientId_idx" ON "{SCHEMA}"."Invoice"("patientId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "{SCHEMA}"."Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_issuedAt_idx" ON "{SCHEMA}"."Invoice"("issuedAt");

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."Appointment" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "physiotherapistId" TEXT NOT NULL,
  "roomId" TEXT,
  "invoiceId" TEXT,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "status" "{SCHEMA}"."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "type" "{SCHEMA}"."AppointmentType" NOT NULL DEFAULT 'FOLLOW_UP',
  "notes" TEXT,
  "paymentStatus" "{SCHEMA}"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" "{SCHEMA}"."PaymentMethod",
  "paymentValue" DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "{SCHEMA}"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_physiotherapistId_fkey" FOREIGN KEY ("physiotherapistId") REFERENCES "{SCHEMA}"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Appointment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "{SCHEMA}"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Appointment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "{SCHEMA}"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."Session" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "physiotherapistId" TEXT NOT NULL,
  "sessionNumber" INTEGER NOT NULL DEFAULT 1,
  "techniques" TEXT[],
  "notes" TEXT,
  "evolution" TEXT,
  "painLevel" INTEGER,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Session_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "{SCHEMA}"."Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Session_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "{SCHEMA}"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Session_physiotherapistId_fkey" FOREIGN KEY ("physiotherapistId") REFERENCES "{SCHEMA}"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Session_appointmentId_key" ON "{SCHEMA}"."Session"("appointmentId");

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."Anamnesis" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "chiefComplaint" TEXT,
  "history" TEXT,
  "medications" TEXT,
  "allergies" TEXT,
  "surgeries" TEXT,
  "familyHistory" TEXT,
  "lifestyle" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Anamnesis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Anamnesis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "{SCHEMA}"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Anamnesis_patientId_key" ON "{SCHEMA}"."Anamnesis"("patientId");

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."ClinicSettings" (
  "id" TEXT NOT NULL,
  "sessionDuration" INTEGER NOT NULL DEFAULT 60,
  "openingTime" TEXT NOT NULL DEFAULT '08:00',
  "closingTime" TEXT NOT NULL DEFAULT '18:00',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClinicSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."Payment" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "method" "{SCHEMA}"."PaymentMethod" NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "transactionId" TEXT,
  "fees" DECIMAL(10,2),
  "isRefund" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "{SCHEMA}"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "{SCHEMA}"."Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_paidAt_idx" ON "{SCHEMA}"."Payment"("paidAt");

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."Expense" (
  "id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "{SCHEMA}"."ExpenseCategory" NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "status" "{SCHEMA}"."ExpenseStatus" NOT NULL DEFAULT 'PENDING',
  "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  "recurrenceRule" TEXT,
  "parentExpenseId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Expense_parentExpenseId_fkey" FOREIGN KEY ("parentExpenseId") REFERENCES "{SCHEMA}"."Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Expense_status_idx" ON "{SCHEMA}"."Expense"("status");
CREATE INDEX IF NOT EXISTS "Expense_dueDate_idx" ON "{SCHEMA}"."Expense"("dueDate");

CREATE TABLE IF NOT EXISTS "{SCHEMA}"."FinancialAuditLog" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" "{SCHEMA}"."AuditAction" NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "changedBy" TEXT NOT NULL,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FinancialAuditLog_entityType_entityId_idx" ON "{SCHEMA}"."FinancialAuditLog"("entityType", "entityId");
