/**
 * Migration script: adds ClinicSettings table to all existing tenant schemas.
 * Run with: node scripts/add-clinic-settings.mjs
 */
import pg from 'pg'

const { Client } = pg
const CONNECTION = 'postgresql://postgres:Juquinha123%23@localhost:5432/FisioHub'

async function main() {
  const client = new Client({ connectionString: CONNECTION })
  await client.connect()

  // Find all clinic schemas
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
    console.log(`Migrando schema: ${schema_name}...`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schema_name}"."ClinicSettings" (
        "id" TEXT NOT NULL,
        "sessionDuration" INTEGER NOT NULL DEFAULT 60,
        "openingTime" TEXT NOT NULL DEFAULT '08:00',
        "closingTime" TEXT NOT NULL DEFAULT '18:00',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ClinicSettings_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log(`  ✓ ClinicSettings criada em ${schema_name}`)
  }

  await client.end()
  console.log('\n✓ Migração concluída!')
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
