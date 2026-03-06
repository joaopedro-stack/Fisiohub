import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('[webhook] checkout.session.completed', { mode: session.mode, subscription: session.subscription })
      if (session.mode !== 'subscription') break

      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const meta = sub.metadata
      console.log('[webhook] subscription metadata', meta)
      if (!meta.clinicSlug) {
        console.error('[webhook] missing clinicSlug in subscription metadata')
        break
      }

      const plan = (meta.plan ?? 'BASIC') as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'

      await prisma.clinic.update({
        where: { slug: meta.clinicSlug },
        data: {
          stripeSubscriptionId: sub.id,
          stripeCustomerId: sub.customer as string,
          subscriptionStatus: sub.status,
          plan,
        },
      })
      console.log('[webhook] clinic updated', { clinicSlug: meta.clinicSlug, plan, status: sub.status })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const meta = sub.metadata
      if (!meta.clinicSlug) break

      const plan = (meta.plan ?? 'BASIC') as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'

      await prisma.clinic.update({
        where: { slug: meta.clinicSlug },
        data: {
          subscriptionStatus: sub.status,
          plan,
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const meta = sub.metadata
      if (!meta.clinicSlug) break

      await prisma.clinic.update({
        where: { slug: meta.clinicSlug },
        data: {
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
        },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      if (!customerId) break

      await prisma.clinic.updateMany({
        where: { stripeCustomerId: customerId },
        data: { subscriptionStatus: 'past_due' },
      })
      break
    }
  }
  } catch (err) {
    console.error('[webhook] handler error', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
