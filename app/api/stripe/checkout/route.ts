import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  if (!plan || !STRIPE_PRICE_IDS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const clinic = await prisma.clinic.findFirst({
    where: { slug: session.user.clinicSlug ?? '' },
  })
  if (!clinic) return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

  // Ensure Stripe customer exists
  let customerId = clinic.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: clinic.email,
      name: clinic.name,
      metadata: { clinicSlug: clinic.slug, clinicId: clinic.id },
    })
    customerId = customer.id
    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRICE_IDS[plan], quantity: 1 }],
    subscription_data: {
      metadata: { clinicSlug: clinic.slug, clinicId: clinic.id, plan },
    },
    success_url: `${baseUrl}/settings?tab=plan&success=1`,
    cancel_url: `${baseUrl}/settings?tab=plan`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
