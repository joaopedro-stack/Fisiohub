import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
    })
  }
  return _stripe
}

/** @deprecated Use getStripe() instead */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
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
