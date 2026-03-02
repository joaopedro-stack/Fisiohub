import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { startOfYear, endOfYear } from 'date-fns'

interface CategoryRow {
  category: string
  amount: bigint | string | number
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const prisma = getTenantPrisma(slug)
  const { searchParams } = new URL(req.url)

  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10)
  const from = startOfYear(new Date(year, 0, 1))
  const to = endOfYear(new Date(year, 0, 1))

  const [revenueResult, refundResult, insuranceResult, expenseByCategory] = await Promise.all([
    // Gross revenue: all non-refund payments in period
    prisma.$queryRaw<Array<{ amount: bigint | string | number }>>`
      SELECT COALESCE(SUM(p.amount), 0) AS amount
      FROM "Payment" p
      WHERE p."isRefund" = false
        AND p."paidAt" >= ${from}
        AND p."paidAt" <= ${to}
    `,
    // Deductions: refund payments
    prisma.$queryRaw<Array<{ amount: bigint | string | number }>>`
      SELECT COALESCE(SUM(p.amount), 0) AS amount
      FROM "Payment" p
      WHERE p."isRefund" = true
        AND p."paidAt" >= ${from}
        AND p."paidAt" <= ${to}
    `,
    // Insurance deduction: billed but not received
    prisma.$queryRaw<Array<{ amount: bigint | string | number }>>`
      SELECT COALESCE(SUM(i."insuranceBilledAmount" - COALESCE(i."insuranceReceivedAmount", 0)), 0) AS amount
      FROM "Invoice" i
      WHERE i."isInsurance" = true
        AND i."issuedAt" >= ${from}
        AND i."issuedAt" <= ${to}
        AND i."insuranceStatus" IN ('BILLED', 'PARTIAL', 'GLOSA')
    `,
    // Expenses by category
    prisma.$queryRaw<CategoryRow[]>`
      SELECT e.category, COALESCE(SUM(e.amount), 0) AS amount
      FROM "Expense" e
      WHERE e.status = 'PAID'
        AND e."paidAt" >= ${from}
        AND e."paidAt" <= ${to}
      GROUP BY e.category
      ORDER BY amount DESC
    `,
  ])

  const grossRevenue = Number(revenueResult[0]?.amount ?? 0)
  const refunds = Number(refundResult[0]?.amount ?? 0)
  const insurancePending = Number(insuranceResult[0]?.amount ?? 0)
  const netRevenue = grossRevenue - refunds - insurancePending

  const expenseMap: Record<string, number> = {}
  let totalExpenses = 0
  for (const row of expenseByCategory) {
    expenseMap[row.category] = Number(row.amount)
    totalExpenses += Number(row.amount)
  }

  const profit = netRevenue - totalExpenses

  return NextResponse.json({
    year,
    grossRevenue,
    deductions: {
      refunds,
      insurancePending,
      total: refunds + insurancePending,
    },
    netRevenue,
    expenses: {
      byCategory: expenseMap,
      total: totalExpenses,
    },
    profit,
    profitMargin: netRevenue > 0 ? ((profit / netRevenue) * 100).toFixed(2) : '0.00',
  })
}
