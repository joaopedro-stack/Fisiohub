/**
 * Migration script: adds physiotherapistId to Patient table in all existing clinic_* schemas.
 * Run once: node scripts/add-patient-physiotherapist.mjs
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
    const { rows: schemas } = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name LIKE 'clinic_%'
      ORDER BY schema_name
    `)

    console.log(`Found ${schemas.length} tenant schema(s).`)

    for (const { schema_name: schema } of schemas) {
      console.log(`\nMigrating schema: ${schema}`)

      await client.query(`
        ALTER TABLE "${schema}"."Patient"
          ADD COLUMN IF NOT EXISTS "physiotherapistId" TEXT
      `)

      await client.query(`
        DO $$ BEGIN
          ALTER TABLE "${schema}"."Patient"
            ADD CONSTRAINT "Patient_physiotherapistId_fkey"
            FOREIGN KEY ("physiotherapistId") REFERENCES "${schema}"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `)

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
