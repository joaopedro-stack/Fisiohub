import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export const STRIPE_PRICE_IDS: Record<string, string> = {
  BASIC: process.env.STRIPE_PRICE_BASIC ?? '',
  PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL ?? '',
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
}

export const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Básico',
  PROFESSIONAL: 'Profissional',
  ENTERPRISE: 'Enterprise',
}
