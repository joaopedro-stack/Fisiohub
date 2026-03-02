import { PrismaClient as PublicPrisma } from '../generated/public/index.js'
import bcrypt from 'bcryptjs'
import pg from 'pg'

const { Client } = pg

const DATABASE_URL = 'postgresql://postgres:Juquinha123%23@localhost:5432/FisioHub?schema=public'

const publicPrisma = new PublicPrisma({
  datasources: { db: { url: DATABASE_URL } },
})

async function provisionSchema(slug) {
  const schemaName = `clinic_${slug}`
  const client = new Client({
    connectionString: 'postgresql://postgres:Juquinha123%23@localhost:5432/FisioHub',
  })
  await client.connect()

  console.log(`Criando schema ${schemaName}...`)

  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)

  // Enums
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

  // Tabelas
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
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "${schemaName}"."User"("email")`)

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
      CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
    )
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}"."Appointment" (
      "id" TEXT NOT NULL,
      "patientId" TEXT NOT NULL,
      "physiotherapistId" TEXT NOT NULL,
      "startTime" TIMESTAMP(3) NOT NULL,
      "endTime" TIMESTAMP(3) NOT NULL,
      "status" "${schemaName}"."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
      "type" "${schemaName}"."AppointmentType" NOT NULL DEFAULT 'FOLLOW_UP',
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "${schemaName}"."Patient"("id"),
      CONSTRAINT "Appointment_physiotherapistId_fkey" FOREIGN KEY ("physiotherapistId") REFERENCES "${schemaName}"."User"("id")
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
      CONSTRAINT "Session_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "${schemaName}"."Appointment"("id"),
      CONSTRAINT "Session_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "${schemaName}"."Patient"("id"),
      CONSTRAINT "Session_physiotherapistId_fkey" FOREIGN KEY ("physiotherapistId") REFERENCES "${schemaName}"."User"("id")
    )
  `)
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Session_appointmentId_key" ON "${schemaName}"."Session"("appointmentId")`)

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
      CONSTRAINT "Anamnesis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "${schemaName}"."Patient"("id")
    )
  `)
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Anamnesis_patientId_key" ON "${schemaName}"."Anamnesis"("patientId")`)

  await client.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}"."Room" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
    )
  `)

  await client.query(`
    ALTER TABLE "${schemaName}"."Appointment"
    ADD COLUMN IF NOT EXISTS "roomId" TEXT
  `)

  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = '${schemaName}'
          AND constraint_name = 'Appointment_roomId_fkey'
      ) THEN
        ALTER TABLE "${schemaName}"."Appointment"
        ADD CONSTRAINT "Appointment_roomId_fkey"
        FOREIGN KEY ("roomId") REFERENCES "${schemaName}"."Room"("id");
      END IF;
    END $$;
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}"."ClinicSettings" (
      "id" TEXT NOT NULL,
      "sessionDuration" INTEGER NOT NULL DEFAULT 60,
      "openingTime" TEXT NOT NULL DEFAULT '08:00',
      "closingTime" TEXT NOT NULL DEFAULT '18:00',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ClinicSettings_pkey" PRIMARY KEY ("id")
    )
  `)

  await client.end()
  console.log(`Schema ${schemaName} criado com sucesso!`)
}

async function createTenantUser(slug, userData) {
  const tenantUrl = `postgresql://postgres:Juquinha123%23@localhost:5432/FisioHub?schema=clinic_${slug}`
  const tenantPrisma = new PublicPrisma({ datasources: { db: { url: tenantUrl } } })

  // Usar query raw para inserir no schema correto
  const client = new Client({
    connectionString: 'postgresql://postgres:Juquinha123%23@localhost:5432/FisioHub',
  })
  await client.connect()
  await client.query(`SET search_path TO "clinic_${slug}"`)

  const hashedPassword = await bcrypt.hash(userData.password, 12)
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36)

  await client.query(
    `INSERT INTO "clinic_${slug}"."User" (id, email, password, name, role, "updatedAt")
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (email) DO NOTHING`,
    [id, userData.email, hashedPassword, userData.name, userData.role]
  )

  await client.end()
  console.log(`Usuário ${userData.email} criado na clínica ${slug}`)
}

async function main() {
  console.log('\n=== FisioHub Seed ===\n')

  // 1. Super Admin
  const superAdminPassword = await bcrypt.hash('admin123', 12)
  await publicPrisma.superAdmin.upsert({
    where: { email: 'admin@fisiohub.com' },
    update: {},
    create: {
      email: 'admin@fisiohub.com',
      password: superAdminPassword,
      name: 'Super Admin',
    },
  })
  console.log('✓ SuperAdmin criado: admin@fisiohub.com / admin123')

  // 2. Clínica de teste
  const clinic = await publicPrisma.clinic.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Clínica Demo',
      slug: 'demo',
      email: 'demo@clinica.com',
      phone: '(11) 99999-9999',
      plan: 'PROFESSIONAL',
    },
  })
  console.log(`✓ Clínica criada: ${clinic.name} (slug: demo)`)

  // 3. Provisionar schema da clínica
  await provisionSchema('demo')

  // 4. Admin da clínica
  await createTenantUser('demo', {
    email: 'joao@demo.com',
    password: 'joao123',
    name: 'João Silva',
    role: 'ADMIN',
  })
  console.log('✓ Admin da clínica: joao@demo.com / joao123')

  // 5. Fisioterapeuta de teste
  await createTenantUser('demo', {
    email: 'fisio@demo.com',
    password: 'fisio123',
    name: 'Dra. Ana Souza',
    role: 'PHYSIOTHERAPIST',
  })
  console.log('✓ Fisioterapeuta: fisio@demo.com / fisio123')

  console.log('\n=== Seed concluído! ===')
  console.log('\nAcesse:')
  console.log('  Super Admin : http://localhost:3000/login  →  admin@fisiohub.com / admin123')
  console.log('  Clínica Demo: http://demo.localhost:3000/login  →  joao@demo.com / joao123')
  console.log('\n(Para subdomínio local, adicione no arquivo hosts:')
  console.log('  127.0.0.1  demo.localhost)\n')
}

main()
  .catch(console.error)
  .finally(() => publicPrisma.$disconnect())
