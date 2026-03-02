import { NextRequest, NextResponse } from 'next/server'
import { prisma as publicPrisma } from '@/lib/prisma'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import { startOfMonth, endOfMonth, setDate, getDate } from 'date-fns'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  // Target: current month
  const targetMonthStart = startOfMonth(now)
  const targetMonthEnd = endOfMonth(now)

  let generated = 0
  let errors = 0

  try {
    const clinics = await publicPrisma.clinic.findMany({
      where: { isActive: true },
      select: { slug: true },
    })

    for (const clinic of clinics) {
      try {
        const prisma = getTenantPrisma(clinic.slug)

        // Find all root recurring expenses
        const recurringExpenses = await prisma.expense.findMany({
          where: {
            isRecurring: true,
            recurrenceRule: 'monthly',
            parentExpenseId: null,
          } as never,
        })

        for (const parent of recurringExpenses) {
          // Check if an instance already exists for this month
          const existing = await prisma.expense.findFirst({
            where: {
              parentExpenseId: parent.id,
              createdAt: { gte: targetMonthStart, lte: targetMonthEnd },
            } as never,
          })

          if (existing) continue

          // Create instance for current month, due on the same day of month as parent
          const dayOfMonth = getDate(parent.dueDate)
          let dueDate: Date
          try {
            dueDate = setDate(now, dayOfMonth)
          } catch {
            dueDate = targetMonthStart
          }

          await prisma.expense.create({
            data: {
              description: parent.description,
              category: parent.category,
              amount: parent.amount,
              dueDate,
              isRecurring: false,
              parentExpenseId: parent.id,
              updatedAt: new Date(),
            } as never,
          })

          generated++
        }
      } catch {
        errors++
      }
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to query clinics', detail: String(err) }, { status: 500 })
  }

  return NextResponse.json({ generated, errors, month: targetMonthStart.toISOString() })
}
