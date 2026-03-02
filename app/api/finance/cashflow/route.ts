import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { getTenantSlug } from '@/lib/get-tenant-slug'
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MonthlyRow {
  month: Date
  amount: bigint | string | number
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = await getTenantSlug()
  if (!slug || slug === 'app') return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })

  const prisma = getTenantPrisma(slug)
  const { searchParams } = new URL(req.url)

  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(new Date().getFullYear(), 0, 1)
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date()

  const [revenueRows, expenseRows] = await Promise.all([
    prisma.$queryRaw<MonthlyRow[]>`
      SELECT DATE_TRUNC('month', p."paidAt") AS month, SUM(p.amount) AS amount
      FROM "Payment" p
      WHERE p."isRefund" = false
        AND p."paidAt" >= ${from}
        AND p."paidAt" <= ${to}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<MonthlyRow[]>`
      SELECT DATE_TRUNC('month', e."paidAt") AS month, SUM(e.amount) AS amount
      FROM "Expense" e
      WHERE e.status = 'PAID'
        AND e."paidAt" >= ${from}
        AND e."paidAt" <= ${to}
      GROUP BY 1
      ORDER BY 1
    `,
  ])

  const revenueMap = new Map<string, number>()
  for (const row of revenueRows) {
    const key = format(new Date(row.month), 'yyyy-MM')
    revenueMap.set(key, Number(row.amount))
  }

  const expenseMap = new Map<string, number>()
  for (const row of expenseRows) {
    const key = format(new Date(row.month), 'yyyy-MM')
    expenseMap.set(key, Number(row.amount))
  }

  const months = eachMonthOfInterval({ start: startOfMonth(from), end: endOfMonth(to) })
  let accumulated = 0
  const data = months.map((m) => {
    const key = format(m, 'yyyy-MM')
    const revenue = revenueMap.get(key) ?? 0
    const expenses = expenseMap.get(key) ?? 0
    const balance = revenue - expenses
    accumulated += balance
    return {
      month: key,
      monthLabel: format(m, 'MMM/yy', { locale: ptBR }),
      revenue,
      expenses,
      balance,
      accumulated,
    }
  })

  return NextResponse.json({ data })
}
