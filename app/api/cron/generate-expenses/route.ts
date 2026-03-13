import { NextRequest, NextResponse } from 'next/server'
import { prisma as publicPrisma } from '@/lib/prisma'
import { getTenantPrisma } from '@/lib/tenant-prisma'
import {
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  startOfQuarter, endOfQuarter,
  startOfYear, endOfYear,
  setDate, setDay, getDate, getDay, getMonth, getYear,
} from 'date-fns'

function getRecurrenceWindow(now: Date, rule: string): { start: Date; end: Date } {
  switch (rule) {
    case 'weekly':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'quarterly':
      return { start: startOfQuarter(now), end: endOfQuarter(now) }
    case 'yearly':
      return { start: startOfYear(now), end: endOfYear(now) }
    default: // monthly
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

function getDueDate(parentDueDate: Date, now: Date, rule: string): Date {
  try {
    switch (rule) {
      case 'weekly':
        return setDay(now, getDay(parentDueDate), { weekStartsOn: 1 })
      case 'quarterly': {
        const parentMonthInQuarter = getMonth(parentDueDate) % 3
        const currentQuarterStartMonth = Math.floor(getMonth(now) / 3) * 3
        return new Date(getYear(now), currentQuarterStartMonth + parentMonthInQuarter, getDate(parentDueDate))
      }
      case 'yearly':
        return new Date(getYear(now), getMonth(parentDueDate), getDate(parentDueDate))
      default: // monthly
        return setDate(now, getDate(parentDueDate))
    }
  } catch {
    return startOfMonth(now)
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
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

        // Find all root recurring expenses (any recurrence rule)
        const recurringExpenses = await prisma.expense.findMany({
          where: {
            isRecurring: true,
            parentExpenseId: null,
          } as never,
        })

        for (const parent of recurringExpenses) {
          const rule = (parent as unknown as { recurrenceRule: string | null }).recurrenceRule ?? 'monthly'
          const { start, end } = getRecurrenceWindow(now, rule)

          // Check if an instance already exists for this period
          const existing = await prisma.expense.findFirst({
            where: {
              parentExpenseId: parent.id,
              createdAt: { gte: start, lte: end },
            } as never,
          })

          if (existing) continue

          const dueDate = getDueDate(parent.dueDate, now, rule)

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

  return NextResponse.json({ generated, errors, timestamp: now.toISOString() })
}
