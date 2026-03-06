/**
 * Run once to create Stripe products and prices.
 * Usage: npx tsx scripts/setup-stripe.ts
 *
 * Copies the resulting price IDs to your .env file as:
 *   STRIPE_PRICE_BASIC=price_xxx
 *   STRIPE_PRICE_PROFESSIONAL=price_xxx
 *   STRIPE_PRICE_ENTERPRISE=price_xxx
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

const plans = [
  { key: 'BASIC', name: 'FisioHub Básico', amount: 14900 },
  { key: 'PROFESSIONAL', name: 'FisioHub Profissional', amount: 34900 },
  { key: 'ENTERPRISE', name: 'FisioHub Enterprise', amount: 79900 },
]

async function main() {
  console.log('Creating Stripe products and prices...\n')

  for (const plan of plans) {
    const product = await stripe.products.create({
      name: plan.name,
      metadata: { plan_key: plan.key },
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: 'brl',
      recurring: { interval: 'month' },
      metadata: { plan_key: plan.key },
    })

    console.log(`${plan.key}: ${price.id}`)
    console.log(`Add to .env: STRIPE_PRICE_${plan.key}=${price.id}\n`)
  }

  console.log('Done! Copy the price IDs above to your .env file.')
}

main().catch(console.error)
