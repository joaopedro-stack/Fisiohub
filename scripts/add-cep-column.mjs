/**
 * One-time migration: adds the "cep" column to Patient table in all existing tenant schemas.
 * Run with: node scripts/add-cep-column.mjs
 */

import pg from 'pg'
import { config } from 'dotenv'

config({ path: '.env' })
config({ path: '.env.local' })

const { Client } = pg

const client = new Client({ connectionString: process.env.DATABASE_URL })

async function main() {
  await client.connect()
  console.log('Connected to database.')

  // Get all active clinic slugs from the public schema
  const { rows: clinics } = await client.query(
    `SELECT slug FROM public."Clinic" WHERE "isActive" = true`
  )

  if (clinics.length === 0) {
    console.log('No active clinics found.')
    return
  }

  console.log(`Found ${clinics.length} clinic(s): ${clinics.map(c => c.slug).join(', ')}`)

  for (const { slug } of clinics) {
    const schema = `clinic_${slug}`
    try {
      await client.query(
        `ALTER TABLE "${schema}"."Patient" ADD COLUMN IF NOT EXISTS "cep" TEXT`
      )
      console.log(`✓ ${schema}: column "cep" added (or already existed)`)
    } catch (err) {
      console.error(`✗ ${schema}: ${err.message}`)
    }
  }

  console.log('Done.')
}

main()
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
  .finally(() => client.end())
