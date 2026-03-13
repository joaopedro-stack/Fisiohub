import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pub = prisma as any

const PLAN_RANK: Record<string, number> = { BASIC: 1, PROFESSIONAL: 2, ENTERPRISE: 3 }

// POST — upgrade (immediate + prorata) or schedule downgrade (end of period)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { plan: newPlan } = await req.json()
    if (!newPlan || !STRIPE_PRICE_IDS[newPlan]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const clinic = await pub.clinic.findFirst({
      where: { slug: session.user.clinicSlug ?? '' },
    })
    if (!clinic) return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 404 })

    if (!clinic.stripeSubscriptionId || clinic.subscriptionStatus !== 'active') {
      return NextResponse.json({ error: 'no_active_subscription' }, { status: 422 })
    }

    const currentPlan = clinic.plan
    if (newPlan === currentPlan && !clinic.pendingPlan) {
      return NextResponse.json({ error: 'Já está neste plano' }, { status: 400 })
    }

    const isUpgrade = (PLAN_RANK[newPlan] ?? 0) > (PLAN_RANK[currentPlan] ?? 0)

    const sub = await stripe.subscriptions.retrieve(clinic.stripeSubscriptionId)
    const currentItem = sub.items.data[0]
    if (!currentItem) {
      return NextResponse.json({ error: 'Assinatura sem item de preço' }, { status: 422 })
    }

    const rawPeriodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
    const periodEnd =
      rawPeriodEnd && !isNaN(rawPeriodEnd)
        ? new Date(rawPeriodEnd * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (isUpgrade) {
      await stripe.subscriptions.update(clinic.stripeSubscriptionId, {
        proration_behavior: 'always_invoice',
        items: [{ id: currentItem.id, price: STRIPE_PRICE_IDS[newPlan] }],
        metadata: { ...sub.metadata, plan: newPlan },
      })

      await pub.clinic.update({
        where: { id: clinic.id },
        data: {
          pendingPlan: null,
          pendingPlanAt: null,
        },
      })

      return NextResponse.json({ type: 'upgrade', effective: 'immediate' })
    } else {
      await pub.clinic.update({
        where: { id: clinic.id },
        data: {
          pendingPlan: newPlan,
          pendingPlanAt: periodEnd,
          currentPeriodEnd: periodEnd,
        },
      })

      return NextResponse.json({ type: 'downgrade', effective: 'period_end', effectiveDate: periodEnd })
    }
  } catch (err) {
    console.error('[change-plan] erro:', err)
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE — cancelar downgrade pendente
export async function DELETE() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const clinic = await pub.clinic.findFirst({
      where: { slug: session.user.clinicSlug ?? '' },
    })
    if (!clinic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await pub.clinic.update({
      where: { id: clinic.id },
      data: {
        pendingPlan: null,
        pendingPlanAt: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[change-plan DELETE] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
