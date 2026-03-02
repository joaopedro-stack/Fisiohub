/**
 * Migration script: adds Room table and roomId column to Appointment
 * for all existing tenant schemas.
 * Run with: node scripts/add-rooms.mjs
 */
import pg from 'pg'

const { Client } = pg
const CONNECTION = 'postgresql://postgres:Juquinha123%23@localhost:5432/FisioHub'

async function main() {
  const client = new Client({ connectionString: CONNECTION })
  await client.connect()

  const { rows } = await client.query(`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'clinic_%'
    ORDER BY schema_name
  `)

  if (rows.length === 0) {
    console.log('Nenhum schema de clínica encontrado.')
    await client.end()
    return
  }

  for (const { schema_name } of rows) {
    console.log(`Migrando schema: ${schema_name}…`)

    // Create Room table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schema_name}"."Room" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log(`  ✓ Tabela Room criada em ${schema_name}`)

    // Add roomId column to Appointment (idempotent)
    await client.query(`
      ALTER TABLE "${schema_name}"."Appointment"
      ADD COLUMN IF NOT EXISTS "roomId" TEXT
    `)
    console.log(`  ✓ Coluna roomId adicionada em ${schema_name}."Appointment"`)

    // Add FK (wrapped in DO to ignore if already exists)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_schema = '${schema_name}'
            AND constraint_name = 'Appointment_roomId_fkey'
        ) THEN
          ALTER TABLE "${schema_name}"."Appointment"
          ADD CONSTRAINT "Appointment_roomId_fkey"
          FOREIGN KEY ("roomId") REFERENCES "${schema_name}"."Room"("id");
        END IF;
      END $$;
    `)
    console.log(`  ✓ FK roomId configurada em ${schema_name}`)
  }

  await client.end()
  console.log('\n✓ Migração de salas concluída!')
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
