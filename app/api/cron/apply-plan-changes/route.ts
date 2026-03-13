import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Busca clínicas cujo downgrade já venceu
  const clinics = await prisma.clinic.findMany({
    where: {
      pendingPlan: { not: null },
      pendingPlanAt: { lte: new Date() },
      stripeSubscriptionId: { not: null },
      subscriptionStatus: 'active',
    } as never,
  }) as unknown as { id: string; slug: string; stripeSubscriptionId: string | null; pendingPlan: string | null; pendingPlanAt: Date | null }[]

  const results: { slug: string; plan?: string | null; status: string; error?: string }[] = []

  for (const clinic of clinics) {
    try {
      const sub = await stripe.subscriptions.retrieve(clinic.stripeSubscriptionId!)
      const currentItem = sub.items.data[0]

      // Aplica o downgrade no Stripe sem prorata (o cliente já pagou o período inteiro)
      await stripe.subscriptions.update(clinic.stripeSubscriptionId!, {
        proration_behavior: 'none',
        items: [{ id: currentItem.id, price: STRIPE_PRICE_IDS[clinic.pendingPlan!] }],
        metadata: { ...sub.metadata, plan: clinic.pendingPlan! },
      })

      await prisma.clinic.update({
        where: { id: clinic.id },
        data: {
          plan: clinic.pendingPlan! as never,
          pendingPlan: null,
          pendingPlanAt: null,
        } as never,
      })

      results.push({ slug: clinic.slug, plan: clinic.pendingPlan, status: 'applied' })
    } catch (err) {
      console.error(`[apply-plan-changes] erro para ${clinic.slug}:`, err)
      results.push({ slug: clinic.slug, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
