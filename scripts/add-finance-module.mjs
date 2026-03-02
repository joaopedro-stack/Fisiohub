/**
 * Migration script: adds financial module tables to all existing clinic_* schemas.
 * Run once: node scripts/add-finance-module.mjs
 */
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const { Client } = pg

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    // List all clinic schemas
    const { rows: schemas } = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'clinic_%'
      ORDER BY schema_name
    `)

    console.log(`Found ${schemas.length} tenant schema(s).`)

    for (const { schema_name: schema } of schemas) {
      console.log(`\nMigrating schema: ${schema}`)

      // New enums
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}"."InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'OVERDUE', 'CANCELED');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `)
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}"."InsuranceStatus" AS ENUM ('BILLED', 'RECEIVED', 'PARTIAL', 'GLOSA');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `)
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}"."ExpenseCategory" AS ENUM ('RENT', 'SALARY', 'SUPPLIES', 'EQUIPMENT', 'UTILITIES', 'MARKETING', 'TAXES', 'OTHER');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `)
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}"."ExpenseStatus" AS ENUM ('PENDING', 'PAID');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `)
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `)

      // Ensure existing payment enums exist (idempotent)
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'INSURANCE', 'WAIVED');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `)
      await client.query(`
        DO $$ BEGIN
          CREATE TYPE "${schema}"."PaymentMethod" AS ENUM ('CASH', 'PIX', 'CARD', 'INSURANCE', 'OTHER');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `)

      // Invoice table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}"."Invoice" (
          "id" TEXT NOT NULL,
          "patientId" TEXT NOT NULL,
          "totalAmount" DECIMAL(10,2) NOT NULL,
          "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "dueDate" TIMESTAMP(3),
          "paidAt" TIMESTAMP(3),
          "status" "${schema}"."InvoiceStatus" NOT NULL DEFAULT 'OPEN',
          "notes" TEXT,
          "isInsurance" BOOLEAN NOT NULL DEFAULT false,
          "insuranceBilledAmount" DECIMAL(10,2),
          "insuranceExpectedAmount" DECIMAL(10,2),
          "insuranceReceivedAmount" DECIMAL(10,2),
          "insuranceStatus" "${schema}"."InsuranceStatus",
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "${schema}"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `)
      await client.query(`CREATE INDEX IF NOT EXISTS "Invoice_patientId_idx" ON "${schema}"."Invoice"("patientId")`)
      await client.query(`CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "${schema}"."Invoice"("status")`)
      await client.query(`CREATE INDEX IF NOT EXISTS "Invoice_issuedAt_idx" ON "${schema}"."Invoice"("issuedAt")`)

      // Add invoiceId column to Appointment (idempotent)
      await client.query(`
        ALTER TABLE "${schema}"."Appointment"
          ADD COLUMN IF NOT EXISTS "invoiceId" TEXT,
          ADD COLUMN IF NOT EXISTS "roomId" TEXT,
          ADD COLUMN IF NOT EXISTS "paymentStatus" "${schema}"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
          ADD COLUMN IF NOT EXISTS "paymentMethod" "${schema}"."PaymentMethod",
          ADD COLUMN IF NOT EXISTS "paymentValue" DECIMAL(10,2)
      `)
      // Add FK for invoiceId if Invoice table now exists
      await client.query(`
        DO $$ BEGIN
          ALTER TABLE "${schema}"."Appointment"
            ADD CONSTRAINT "Appointment_invoiceId_fkey"
            FOREIGN KEY ("invoiceId") REFERENCES "${schema}"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `)

      // Payment table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}"."Payment" (
          "id" TEXT NOT NULL,
          "invoiceId" TEXT NOT NULL,
          "amount" DECIMAL(10,2) NOT NULL,
          "method" "${schema}"."PaymentMethod" NOT NULL,
          "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "transactionId" TEXT,
          "fees" DECIMAL(10,2),
          "isRefund" BOOLEAN NOT NULL DEFAULT false,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "${schema}"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `)
      await client.query(`CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "${schema}"."Payment"("invoiceId")`)
      await client.query(`CREATE INDEX IF NOT EXISTS "Payment_paidAt_idx" ON "${schema}"."Payment"("paidAt")`)

      // Expense table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}"."Expense" (
          "id" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "category" "${schema}"."ExpenseCategory" NOT NULL,
          "amount" DECIMAL(10,2) NOT NULL,
          "dueDate" TIMESTAMP(3) NOT NULL,
          "paidAt" TIMESTAMP(3),
          "status" "${schema}"."ExpenseStatus" NOT NULL DEFAULT 'PENDING',
          "isRecurring" BOOLEAN NOT NULL DEFAULT false,
          "recurrenceRule" TEXT,
          "parentExpenseId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Expense_parentExpenseId_fkey" FOREIGN KEY ("parentExpenseId") REFERENCES "${schema}"."Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `)
      await client.query(`CREATE INDEX IF NOT EXISTS "Expense_status_idx" ON "${schema}"."Expense"("status")`)
      await client.query(`CREATE INDEX IF NOT EXISTS "Expense_dueDate_idx" ON "${schema}"."Expense"("dueDate")`)

      // FinancialAuditLog table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}"."FinancialAuditLog" (
          "id" TEXT NOT NULL,
          "entityType" TEXT NOT NULL,
          "entityId" TEXT NOT NULL,
          "action" "${schema}"."AuditAction" NOT NULL,
          "oldValue" JSONB,
          "newValue" JSONB,
          "changedBy" TEXT NOT NULL,
          "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "FinancialAuditLog_pkey" PRIMARY KEY ("id")
        )
      `)
      await client.query(`CREATE INDEX IF NOT EXISTS "FinancialAuditLog_entityType_entityId_idx" ON "${schema}"."FinancialAuditLog"("entityType", "entityId")`)

      console.log(`  ✓ ${schema} migrated`)
    }

    console.log('\nAll schemas migrated successfully.')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
