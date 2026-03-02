import { Client } from 'pg'
import { prisma } from '@/lib/prisma'

export async function provisionTenant(slug: string): Promise<void> {
  const schemaName = `clinic_${slug}`
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    // Create schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)

    // Create enums (PostgreSQL doesn't support IF NOT EXISTS for types, use DO block)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."UserRole" AS ENUM ('ADMIN', 'PHYSIOTHERAPIST', 'RECEPTIONIST');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."AppointmentType" AS ENUM ('INITIAL_EVALUATION', 'FOLLOW_UP', 'DISCHARGE', 'RETURN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'INSURANCE', 'WAIVED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."PaymentMethod" AS ENUM ('CASH', 'PIX', 'CARD', 'INSURANCE', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'OVERDUE', 'CANCELED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."InsuranceStatus" AS ENUM ('BILLED', 'RECEIVED', 'PARTIAL', 'GLOSA');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."ExpenseCategory" AS ENUM ('RENT', 'SALARY', 'SUPPLIES', 'EQUIPMENT', 'UTILITIES', 'MARKETING', 'TAXES', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."ExpenseStatus" AS ENUM ('PENDING', 'PAID');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "${schemaName}"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" "${schemaName}"."UserRole" NOT NULL DEFAULT 'PHYSIOTHERAPIST',
        "phone" TEXT,
        "avatar" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      )
    `)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "${schemaName}"."User"("email")
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Patient" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT,
        "phone" TEXT,
        "cpf" TEXT,
        "birthDate" TIMESTAMP(3),
        "gender" "${schemaName}"."Gender",
        "address" TEXT,
        "healthInsurance" TEXT,
        "emergencyContact" TEXT,
        "notes" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "physiotherapistId" TEXT,
        CONSTRAINT "Patient_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Patient_physiotherapistId_fkey" FOREIGN KEY ("physiotherapistId") REFERENCES "${schemaName}"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Invoice" (
        "id" TEXT NOT NULL,
        "patientId" TEXT NOT NULL,
        "totalAmount" DECIMAL(10,2) NOT NULL,
        "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueDate" TIMESTAMP(3),
        "paidAt" TIMESTAMP(3),
        "status" "${schemaName}"."InvoiceStatus" NOT NULL DEFAULT 'OPEN',
        "notes" TEXT,
        "isInsurance" BOOLEAN NOT NULL DEFAULT false,
        "insuranceBilledAmount" DECIMAL(10,2),
        "insuranceExpectedAmount" DECIMAL(10,2),
        "insuranceReceivedAmount" DECIMAL(10,2),
        "insuranceStatus" "${schemaName}"."InsuranceStatus",
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "${schemaName}"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS "Invoice_patientId_idx" ON "${schemaName}"."Invoice"("patientId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "${schemaName}"."Invoice"("status")`)
    await client.query(`CREATE INDEX IF NOT EXISTS "Invoice_issuedAt_idx" ON "${schemaName}"."Invoice"("issuedAt")`)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Appointment" (
        "id" TEXT NOT NULL,
        "patientId" TEXT NOT NULL,
        "physiotherapistId" TEXT NOT NULL,
        "roomId" TEXT,
        "invoiceId" TEXT,
        "startTime" TIMESTAMP(3) NOT NULL,
        "endTime" TIMESTAMP(3) NOT NULL,
        "status" "${schemaName}"."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
        "type" "${schemaName}"."AppointmentType" NOT NULL DEFAULT 'FOLLOW_UP',
        "notes" TEXT,
        "paymentStatus" "${schemaName}"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "paymentMethod" "${schemaName}"."PaymentMethod",
        "paymentValue" DECIMAL(10,2),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "${schemaName}"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Appointment_physiotherapistId_fkey" FOREIGN KEY ("physiotherapistId") REFERENCES "${schemaName}"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Appointment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "${schemaName}"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Session" (
        "id" TEXT NOT NULL,
        "appointmentId" TEXT NOT NULL,
        "patientId" TEXT NOT NULL,
        "physiotherapistId" TEXT NOT NULL,
        "sessionNumber" INTEGER NOT NULL DEFAULT 1,
        "techniques" TEXT[] NOT NULL DEFAULT '{}',
        "notes" TEXT,
        "evolution" TEXT,
        "painLevel" INTEGER,
        "startTime" TIMESTAMP(3) NOT NULL,
        "endTime" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Session_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "${schemaName}"."Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Session_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "${schemaName}"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "Session_physiotherapistId_fkey" FOREIGN KEY ("physiotherapistId") REFERENCES "${schemaName}"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Session_appointmentId_key" ON "${schemaName}"."Session"("appointmentId")
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Anamnesis" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Anamnesis_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Anamnesis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "${schemaName}"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Anamnesis_patientId_key" ON "${schemaName}"."Anamnesis"("patientId")
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Payment" (
        "id" TEXT NOT NULL,
        "invoiceId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "method" "${schemaName}"."PaymentMethod" NOT NULL,
        "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "transactionId" TEXT,
        "fees" DECIMAL(10,2),
        "isRefund" BOOLEAN NOT NULL DEFAULT false,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "${schemaName}"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "${schemaName}"."Payment"("invoiceId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS "Payment_paidAt_idx" ON "${schemaName}"."Payment"("paidAt")`)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."Expense" (
        "id" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" "${schemaName}"."ExpenseCategory" NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "dueDate" TIMESTAMP(3) NOT NULL,
        "paidAt" TIMESTAMP(3),
        "status" "${schemaName}"."ExpenseStatus" NOT NULL DEFAULT 'PENDING',
        "isRecurring" BOOLEAN NOT NULL DEFAULT false,
        "recurrenceRule" TEXT,
        "parentExpenseId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Expense_parentExpenseId_fkey" FOREIGN KEY ("parentExpenseId") REFERENCES "${schemaName}"."Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS "Expense_status_idx" ON "${schemaName}"."Expense"("status")`)
    await client.query(`CREATE INDEX IF NOT EXISTS "Expense_dueDate_idx" ON "${schemaName}"."Expense"("dueDate")`)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."FinancialAuditLog" (
        "id" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "action" "${schemaName}"."AuditAction" NOT NULL,
        "oldValue" JSONB,
        "newValue" JSONB,
        "changedBy" TEXT NOT NULL,
        "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FinancialAuditLog_pkey" PRIMARY KEY ("id")
      )
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS "FinancialAuditLog_entityType_entityId_idx" ON "${schemaName}"."FinancialAuditLog"("entityType", "entityId")`)
  } finally {
    await client.end()
  }
}

export async function createClinic(data: {
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  plan?: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
  adminName: string
  adminEmail: string
  adminPassword: string
}) {
  const bcrypt = await import('bcryptjs')
  const { createId } = await import('@paralleldrive/cuid2').catch(() => ({ createId: () => Math.random().toString(36).slice(2) }))

  // Create clinic record
  const clinic = await prisma.clinic.create({
    data: {
      name: data.name,
      slug: data.slug,
      email: data.email,
      phone: data.phone,
      address: data.address,
      plan: data.plan ?? 'BASIC',
    },
  })

  // Provision tenant schema
  await provisionTenant(data.slug)

  // Create admin user in tenant schema
  const { getTenantPrisma } = await import('@/lib/tenant-prisma')
  const tenantPrisma = getTenantPrisma(data.slug)
  const hashedPassword = await bcrypt.hash(data.adminPassword, 12)

  await tenantPrisma.user.create({
    data: {
      id: createId(),
      email: data.adminEmail,
      password: hashedPassword,
      name: data.adminName,
      role: 'ADMIN',
      updatedAt: new Date(),
    },
  })

  return clinic
}
